#!/usr/bin/env bash
# 一键启动夏目博客（Linux / macOS）
# 用法: bash start.sh
set -e

echo "🏮 [1/2] 启动中间件 (MySQL / Redis / MinIO / Qdrant / Prometheus / Grafana)..."
docker compose -f docker-compose.middleware.yml up -d

echo "⏳ 等待中间件就绪 (约 30s)..."
sleep 30

echo "📦 [2/2] 构建并启动后端单体 + 前端..."
docker compose -f docker-compose.app.yml up -d --build

echo ""
echo "✅ 全部启动完成！"
echo "   🌸 博客前台:       http://localhost:8888"
echo "   🚪 后端 API:       http://localhost:8080"
echo "   📖 接口文档:       http://localhost:8080/doc.html"
echo "   🗄️  MinIO:          http://localhost:9001        (minioadmin/minioadmin123)"
echo "   🧠 Qdrant:         http://localhost:6333/dashboard"
echo "   📊 Prometheus:     http://localhost:9090"
echo "   📈 Grafana:        http://localhost:13000        (admin/admin123)"
echo ""
echo "   体验账号: admin / admin123"
