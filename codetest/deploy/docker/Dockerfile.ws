FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/ws ./cmd/ws

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/ws /app/ws
ENV PORT=8084 REDIS_ADDR=redis:6379 REDIS_CHANNEL=codetest.metrics
EXPOSE 8084
CMD ["/app/ws"]
