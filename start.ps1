# 一键启动夏目博客（Windows / PowerShell）
# 用法: pwsh start.ps1
$ErrorActionPreference = "Stop"

Write-Host "🏮 [1/2] 启动中间件 (MySQL / Redis / MinIO / Qdrant / Prometheus / Grafana)..." -ForegroundColor Green
docker compose -f docker-compose.middleware.yml up -d

Write-Host "⏳ 等待中间件就绪 (约 30s)..." -ForegroundColor Green
$deadline = (Get-Date).AddSeconds(90)
do {
    Start-Sleep -Seconds 5
    $healthy = (docker ps --filter "health=healthy" --format "{{.Names}}" | Measure-Object).Count
    Write-Host "   已就绪容器: $healthy"
} until ($healthy -ge 3 -or (Get-Date) -gt $deadline)

Write-Host "📦 [2/2] 构建并启动后端单体 + 前端..." -ForegroundColor Green
docker compose -f docker-compose.app.yml up -d --build

Write-Host ""
Write-Host "✅ 全部启动完成！" -ForegroundColor Green
Write-Host "   🌸 博客前台:       http://localhost:8888"
Write-Host "   🚪 后端 API:       http://localhost:8080"
Write-Host "   📖 接口文档:       http://localhost:8080/doc.html"
Write-Host "   🗄️  MinIO 控制台:   http://localhost:9001        (minioadmin/minioadmin123)"
Write-Host "   🧠 Qdrant:         http://localhost:6333/dashboard"
Write-Host "   📊 Prometheus:     http://localhost:9090"
Write-Host "   📈 Grafana:        http://localhost:13000        (admin/admin123)"
Write-Host ""
Write-Host "   体验账号: admin / admin123"
