# Build stage
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server cmd/server/main.go

# Runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata && \
    adduser -D -u 1000 appuser

WORKDIR /app

COPY --from=builder /server .
COPY --from=builder /app/migrations ./migrations

USER appuser

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8081/health || exit 1

CMD ["./server"]
