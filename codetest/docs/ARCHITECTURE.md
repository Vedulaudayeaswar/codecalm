# CodeTest Architecture

## Services

- `upload`: Gin API exposing `POST /upload`. It accepts `.py`, `.cpp`, and `.go` files, stores each submission in `submissions/{id}`, generates a language-specific Dockerfile, builds an image, runs it with `--memory`, `--cpus`, and `--network=none`, then returns execution logs.
- `botload`: high-concurrency worker pool. Each goroutine simulates a trading bot and emits randomized BUY, SELL, and CANCEL HTTP requests to `TARGET_URL`.
- `metrics`: Kafka consumer that aggregates bot telemetry into p50, p90, p99, TPS, active bot count, and error rate. It stores the latest snapshot in Redis and publishes every update over Redis pub/sub.
- `ws`: Gorilla WebSocket server. It subscribes to Redis pub/sub and broadcasts live JSON metrics to all connected dashboards.
- Frontend: `frontend/html/codetest.html` connects to the upload API and WebSocket metrics stream.

## Event Flow

`botload -> Kafka topic bot-events -> metrics consumer -> Redis key/pubsub -> WebSocket server -> dashboard`

Kafka is used for telemetry durability and backpressure between bot workers and metrics consumers. Redis is used for low-latency live state and pub/sub fanout. Docker is used only in the upload service so untrusted submissions are isolated from the platform process.

## Local Run

From the existing CodeCalm app, the easiest development path is now:

```bash
cd backend
python main.py
```

That starts Flask on port `5000` and autostarts the CodeTest Go services on ports `8081`, `8082`, and `8084` when Go is installed. Check `http://localhost:5000/api/codetest/status` to see which services and external dependencies are available.

Set `CODETEST_AUTOSTART=false` if you want to run the Go services manually.

```bash
cd codetest
go mod tidy
go run ./cmd/upload
go run ./cmd/ws
go run ./cmd/metrics
BOT_COUNT=100 TARGET_URL=http://localhost:8080/orders go run ./cmd/botload
```

Docker must be installed for `POST /upload` to build and run submitted code.

## Containers

```bash
cd codetest
docker compose up --build redis kafka upload metrics ws
docker compose --profile load up --build botload
```

## Kubernetes

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/
```

Build and push the images referenced in the manifests before applying them in a real cluster.
