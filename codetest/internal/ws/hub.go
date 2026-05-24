package ws

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
)

type Hub struct {
	RedisAddr string
	Password  string
	Channel   string
	Key       string
	clients   map[*websocket.Conn]bool
	register  chan *websocket.Conn
	remove    chan *websocket.Conn
	broadcast chan []byte
	upgrader  websocket.Upgrader
}

func NewHub(redisAddr, password, channel string) *Hub {
	return &Hub{
		RedisAddr: redisAddr,
		Password:  password,
		Channel:   channel,
		Key:       "codetest:live",
		clients:   make(map[*websocket.Conn]bool),
		register:  make(chan *websocket.Conn),
		remove:    make(chan *websocket.Conn),
		broadcast: make(chan []byte, 128),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(*http.Request) bool { return true },
		},
	}
}

func (h *Hub) Run(ctx context.Context) {
	go h.redisLoop(ctx)
	for {
		select {
		case <-ctx.Done():
			return
		case conn := <-h.register:
			h.clients[conn] = true
		case conn := <-h.remove:
			delete(h.clients, conn)
			_ = conn.Close()
		case msg := <-h.broadcast:
			for conn := range h.clients {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					h.remove <- conn
				}
			}
		}
	}
}

func (h *Hub) Handle(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.register <- conn
	h.sendLatest(c.Request.Context(), conn)
	go func() {
		defer func() { h.remove <- conn }()
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()
}

func (h *Hub) sendLatest(ctx context.Context, conn *websocket.Conn) {
	client := redis.NewClient(&redis.Options{Addr: h.RedisAddr, Password: h.Password})
	defer client.Close()

	payload, err := client.Get(ctx, h.Key).Bytes()
	if err == nil && len(payload) > 0 {
		_ = conn.WriteMessage(websocket.TextMessage, payload)
	}
}

func (h *Hub) redisLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		client := redis.NewClient(&redis.Options{Addr: h.RedisAddr, Password: h.Password})
		pubsub := client.Subscribe(ctx, h.Channel)
		ch := pubsub.Channel()

		for msg := range ch {
			h.broadcast <- []byte(msg.Payload)
		}

		_ = pubsub.Close()
		_ = client.Close()
		log.Println("redis pub/sub disconnected; reconnecting")
		time.Sleep(time.Second)
	}
}
