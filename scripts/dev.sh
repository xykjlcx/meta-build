#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== meta-build dev startup ==="

# 检查 Docker 服务
if ! docker compose -f "$ROOT_DIR/docker-compose.yml" ps --status running | grep -q postgres; then
    echo "⚠ PostgreSQL 未运行，正在启动 Docker 服务..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" up -d
    echo "等待 PostgreSQL 就绪..."
    sleep 3
fi

# 启动后端
echo "启动 Spring Boot 应用..."
cd "$ROOT_DIR/server"
mvn spring-boot:run -pl mb-admin -Dspring-boot.run.profiles=dev
