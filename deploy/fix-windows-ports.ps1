# ============================================================
#  修复 Windows 低端口被 Hyper-V/winnat 征用导致应用无法绑定
#  典型症状：3000 / 9191 / 3307 等端口
#    "bind: An attempt was made to access a socket in a way
#     forbidden by its access permissions."
#
#  根因：TCP 动态端口范围被压低到 1024 起（默认应为 49152 起），
#        winnat 在低位大段保留端口，撞上常用应用端口。
#
#  用法：右键本文件 → 使用 PowerShell 运行；或在普通 PowerShell 里：
#        powershell -ExecutionPolicy Bypass -File .\deploy\fix-windows-ports.ps1
#  脚本会自动申请管理员权限（弹一次 UAC）。
# ============================================================

# ---- 自动提权 ----
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "需要管理员权限，正在申请提权（请在 UAC 弹窗点击“是”）…" -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs `
        -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-File","`"$PSCommandPath`""
    return
}

Write-Host "================ 修复前状态 ================" -ForegroundColor Cyan
netsh int ipv4 show dynamicport tcp

# 需要保护的关键端口（应用监听用）
$protect = @(3000, 9191, 3307)

Write-Host "`n[1/5] 停止 winnat（会短暂中断 Docker 端口转发）…" -ForegroundColor Cyan
net stop winnat 2>&1 | Out-Host

Write-Host "[2/5] 将动态端口范围重置为 Windows 默认（49152 起，共 16384）…" -ForegroundColor Cyan
netsh int ipv4 set dynamicport tcp start=49152 num=16384 | Out-Host
netsh int ipv4 set dynamicport udp start=49152 num=16384 | Out-Host

Write-Host "[3/5] 为关键端口添加持久化保留，防止再次被征用…" -ForegroundColor Cyan
foreach ($p in $protect) {
    netsh int ipv4 add excludedportrange protocol=tcp startport=$p numberofports=1 store=persistent 2>&1 | Out-Host
}

Write-Host "[4/5] 重新启动 winnat…" -ForegroundColor Cyan
net start winnat 2>&1 | Out-Host

Write-Host "`n[5/5] 校验：" -ForegroundColor Cyan
netsh int ipv4 show dynamicport tcp
Write-Host "`n受影响端口是否仍在排除段（理想情况：9191 不再出现在被动态征用的范围内）：" -ForegroundColor Cyan
netsh int ipv4 show excludedportrange protocol=tcp

Write-Host "`n端口占用快速检查（无输出=空闲，可被绑定）：" -ForegroundColor Cyan
foreach ($p in $protect) {
    $busy = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($busy) { Write-Host ("  {0}: 已有监听 (PID {1})" -f $p, $busy[0].OwningProcess) -ForegroundColor Yellow }
    else       { Write-Host ("  {0}: 空闲，可绑定" -f $p) -ForegroundColor Green }
}

Write-Host "`n✅ 完成。现在可以启动 Copilot gateway（监听 9191）。" -ForegroundColor Green
Write-Host "   若 Docker 发布端口出现异常，运行：docker compose -f docker-compose.middleware.yml restart" -ForegroundColor DarkGray
Write-Host "`n按任意键关闭…" -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
