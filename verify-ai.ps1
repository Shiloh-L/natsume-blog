# AI 功能冒烟测试（待本机大模型网关恢复后运行）
# 用法: pwsh verify-ai.ps1
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:8080'

Write-Host "== 0) 大模型网关连通性 ==" -ForegroundColor Cyan
try { Invoke-WebRequest 'http://127.0.0.1:9191/' -TimeoutSec 8 | Out-Null; Write-Host "  网关 UP" -ForegroundColor Green }
catch { Write-Host "  网关仍不可用，请稍后重试" -ForegroundColor Yellow; exit 1 }

Write-Host "== 1) 对话 /api/ai/chat ==" -ForegroundColor Cyan
try { $r = Invoke-RestMethod "$base/api/ai/chat" -Method Post -ContentType 'application/json' -Body (@{message='你好呀'} | ConvertTo-Json) -TimeoutSec 60; Write-Host "  $($r.data)" } catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "== 2) AI 生成文章 /api/ai/write ==" -ForegroundColor Cyan
try { $r = Invoke-RestMethod "$base/api/ai/write" -Method Post -ContentType 'application/json' -Body (@{topic='夏夜的萤火虫';style='治愈温柔'} | ConvertTo-Json) -TimeoutSec 120; Write-Host "  生成字数: $($r.data.Length)" } catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "== 3) AI 起标题 /api/ai/titles ==" -ForegroundColor Cyan
try { $r = Invoke-RestMethod "$base/api/ai/titles" -Method Post -ContentType 'application/json' -Body (@{text='一篇关于猫咪老师和夏天的故事'} | ConvertTo-Json) -TimeoutSec 60; $r.data | ForEach-Object { "   - $_" } } catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "== 4) AI 摘要 /api/ai/summary ==" -ForegroundColor Cyan
try { $r = Invoke-RestMethod "$base/api/ai/summary" -Method Post -ContentType 'application/json' -Body (@{content='夏夜的风穿过稻田，萤火虫在水边轻轻浮动，外婆留下的友人帐记录着妖怪们的名字。'} | ConvertTo-Json) -TimeoutSec 60; Write-Host "  $($r.data)" } catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "== 5) RAG 问答 /api/ai/ask ==" -ForegroundColor Cyan
try { $r = Invoke-RestMethod "$base/api/ai/ask" -Method Post -ContentType 'application/json' -Body (@{question='博客里有哪些治愈的妖怪故事？'} | ConvertTo-Json) -TimeoutSec 90; Write-Host "  回答: $($r.data.answer)"; Write-Host "  引用: $(($r.data.citations | ForEach-Object { $_.title }) -join '、')" } catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "== 6) 流式生成 /api/ai/write/stream ==" -ForegroundColor Cyan
try {
  $req = [System.Net.WebRequest]::Create("$base/api/ai/write/stream?topic=" + [uri]::EscapeDataString('雨后的神社'))
  $resp = $req.GetResponse(); $sr = New-Object IO.StreamReader($resp.GetResponseStream())
  $n = 0; while (-not $sr.EndOfStream -and $n -lt 5) { $line = $sr.ReadLine(); if ($line) { Write-Host "  $line"; $n++ } }
  $sr.Close(); Write-Host "  ...(流式正常)" -ForegroundColor Green
} catch { Write-Host "  ERR $($_.Exception.Message)" }

Write-Host "`n完成。" -ForegroundColor Green
