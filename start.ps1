# 一键启动夏目博客全栈 (Windows / PowerShell)
# 用法: pwsh start.ps1
$ErrorActionPreference = "Stop"

Write-Host "🏮 [1/4] 启动中间件 (MySQL / Redis / Nacos / RabbitMQ / Qdrant / Kafka / MinIO / Sentinel / Tempo / Prometheus / Grafana)..." -ForegroundColor Green
docker compose -f docker-compose.middleware.yml up -d

Write-Host "⏳ [2/4] 等待中间件就绪 (约 60s)..." -ForegroundColor Green
$deadline = (Get-Date).AddSeconds(120)
do {
    Start-Sleep -Seconds 5
    $healthy = (docker ps --filter "health=healthy" --format "{{.Names}}" | Measure-Object).Count
    Write-Host "   已就绪容器: $healthy"
} until ($healthy -ge 6 -or (Get-Date) -gt $deadline)

Write-Host "📦 [3/4] 构建并启动微服务 + 前端..." -ForegroundColor Green
docker compose -f docker-compose.app.yml up -d --build

Write-Host "⚙️  [4/4] 发布 Nacos 共享配置..." -ForegroundColor Green
Start-Sleep -Seconds 10
pwsh -File deploy/nacos/publish-config.ps1

Write-Host ""
Write-Host "✅ 全部启动完成！" -ForegroundColor Green
Write-Host "   🌸 博客前台:       http://localhost:8888"
Write-Host "   🚪 API 网关:       http://localhost:8080"
Write-Host "   🧭 Nacos 控制台:   http://localhost:8848/nacos  (nacos/nacos)"
Write-Host "   🐰 RabbitMQ:       http://localhost:15672       (blog/blog123)"
Write-Host "   🗄️  MinIO 控制台:   http://localhost:9001        (minioadmin/minioadmin123)"
Write-Host "   🛡️  Sentinel:       http://localhost:8858        (sentinel/sentinel)"
Write-Host "   🔭 Tempo 链路:     在 Grafana Explore 中选择 Tempo 数据源查看"
Write-Host "   🧠 Qdrant:         http://localhost:6333/dashboard"
Write-Host "   📨 Kafka UI:       http://localhost:8889"
Write-Host "   📊 Prometheus:     http://localhost:9090"
Write-Host "   📈 Grafana:        http://localhost:13000        (admin/admin123)"
Write-Host "   📖 接口文档示例:   http://localhost:8082/doc.html"
Write-Host ""
Write-Host "   体验账号: admin / admin123"
