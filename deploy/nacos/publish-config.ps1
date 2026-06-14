# 向 Nacos 发布共享配置，演示配置中心能力
# 用法: pwsh deploy/nacos/publish-config.ps1
param([string]$NacosHost = "localhost", [int]$Port = 8848)

$base = "http://${NacosHost}:${Port}/nacos/v1/cs/configs"

function Publish-Config($dataId, $content) {
    $body = @{ dataId = $dataId; group = "DEFAULT_GROUP"; content = $content; type = "yaml" }
    try {
        $r = Invoke-RestMethod -Uri $base -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
        Write-Host "  [OK] $dataId -> $r"
    } catch {
        Write-Host "  [ERR] $dataId -> $($_.Exception.Message)"
    }
}

$shared = @"
# 共享配置（所有微服务）
blog:
  site-name: 夏目友人帐 · 温柔小屋
  author: 夏目贵志
logging:
  level:
    com.natsume.blog: info
"@

Write-Host "发布共享配置到 Nacos ($NacosHost`:$Port) ..."
Publish-Config "shared-blog.yaml" $shared
Publish-Config "blog-gateway.yaml" "# 网关专属配置（占位，可在 Nacos 控制台动态修改）`nblog:`n  module: gateway`n"
Publish-Config "blog-content.yaml" "blog:`n  module: content`n"
Publish-Config "blog-auth.yaml"    "blog:`n  module: auth`n"
Publish-Config "blog-search.yaml"  "blog:`n  module: search`n"
Publish-Config "blog-ai.yaml"      "blog:`n  module: ai`n"
Write-Host "完成。访问 http://$NacosHost`:8848/nacos (nacos/nacos) 查看。"
