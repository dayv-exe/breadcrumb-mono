# syntax=docker/dockerfile:1.7
FROM golang:1.23-bookworm AS build

ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=arm64 \
    GOMODCACHE=/go/pkg/mod \
    GOCACHE=/root/.cache/go-build \
    BIN_ROOT=/app/bin

WORKDIR /app

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

ARG BUILD_DIRS
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    set -e; \
    mkdir -p ${BIN_ROOT}; \
    echo "${BUILD_DIRS}" | tr ',' '\n' | xargs -P 4 -I {} sh -c '\
      dir="$1"; \
      echo "==> Building $dir"; \
      mkdir -p '"${BIN_ROOT}"'/$dir; \
      go build -trimpath -ldflags="-s -w" -o '"${BIN_ROOT}"'/$dir/bootstrap ./cmd/$dir/main.go \
    ' _ {}

# Zip as a separate layer
RUN set -e; \
    echo "${BUILD_DIRS}" | tr ',' '\n' | while read dir; do \
      (cd ${BIN_ROOT}/$dir && zip -q $dir.zip bootstrap); \
    done