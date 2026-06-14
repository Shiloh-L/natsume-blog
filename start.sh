#!/usr/bin/env bash
# 一键启动夏目博客全栈 (Linux / macOS)
# 用法: bash start.sh
set -e

echo "🏮 [1/3] 启动中间件..."
docker compose -f docker-compose.middleware.yml up -d

echo "⏳ [2/3] 等待中间件就绪 (约 60s)..."
for i in $(seq 1 24); do
  sleep 5
  healthy=$(docker ps --filter "health=healthy" --format "{{.Names}}" | wc -l)
  echo "   已就绪容器: $healthy"
  [ "$healthy" -ge 6 ] && break
done

echo "📦 [3/3] 构建并启动微服务 + 前端..."
docker compose -f docker-compose.app.yml up -d --build

echo ""
echo "✅ 启动完成！"
echo "   🌸 博客前台:     http://localhost:8888"
echo "   🚪 API 网关:     http://localhost:8080"
echo "   🧭 Nacos:        http://localhost:8848/nacos  (nacos/nacos)"
echo "   体验账号: admin / admin123"
