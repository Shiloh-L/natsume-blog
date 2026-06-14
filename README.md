# 🏮 夏目友人帐 · 温柔小屋 — 微服务个人博客

> 「把单体应用拆成微服务，就像把名字一个个归还——各司其职，又彼此相连。」

一个以 **《夏目友人帐》水彩治愈风** 为主题、并融入 **宫崎骏式森林与精灵** 氛围的全栈个人博客。
后端采用 **Spring Cloud Alibaba 微服务全家桶**，前端采用 **React 全家桶**，
集成了尽可能多的主流中间件，适合作为 **面试 / 学习** 的综合项目。

> ⚠️ 版权说明：本项目仅取「夏目友人帐 / 吉卜力」的 **水彩、自然、柔和** 美学风格，
> 所有插画（森林守护者、草木精灵、场景封面等）均为 **原创 SVG**，**未使用任何受版权保护的角色或动画画面**。
> 未上传封面时，使用原创水彩场景图（青丘 / 黄昏森林 / 星夜 / 海边 / 雨林 / 花田）按文章稳定分配。

---

## ✨ 功能特性

- 🏡 **首页（Butterfly 卡片式布局）**：沉浸式水彩 banner（层叠山丘 + 暖阳 + 流云 + 飞蝶 + 滚动文案）、左文章流 / 右侧栏（站长卡 · 公告 · 分类 · 标签云 · 小屋资讯）双栏布局
- 📱 **移动端适配**：响应式断点全覆盖、移动端汉堡抽屉导航（搜索 + 全部入口 + 触摸友好）、双栏自动堆叠
- 📝 文章：发布 / 编辑 / 删除、Markdown 渲染、分类、标签、置顶、浏览量、点赞
- 🍂 **文章归档（光阴长卷）**：按年份分组的水彩时间线，一览全部随笔
- 🏷️ **标签聚合页**：点任意标签进入 `/tag/:id` 浏览该标签下全部文章，顶部标签云一键切换
- 📖 **阅读体验（Butterfly 风格）**：卷轴式悬浮目录 TOC（滚动高亮 + 点击平滑跳转）、字数统计、预计阅读时长、顶部阅读进度条
- 💬 评论：二级评论树、登录后留言
- 🔐 认证：注册 / 登录、JWT、Spring Security、RBAC 角色
- 🧠 **向量语义搜索**：Qdrant 向量库 + 本地 ONNX 向量化 + 关键词混合重排（中文友好）
- ✍️ **AI 写作**：流式生成整篇文章、续写、润色、起标题、推荐标签、生成摘要（Spring AI）
- 🐱 **RAG 智能问答**：基于博客全文检索召回 + 大模型生成，答案附引用出处
- 🔔 **消息通知**：评论/回复/点赞/结缘触发站内信，基于 Kafka 异步事件流，导航栏未读红点 + 下拉
- 🦋 **结缘 · 友人帐**：与作者结缘 / 解缘、友人与牵挂数、「友人近况」聚合所结缘作者的最新文章，结缘即推送站内信
- 🍁 **收藏 · 藏书阁**：给珍视的文章夹上书签收藏，「藏书阁」集中回看；收藏态以 **Redis Set** 缓存（Cache-Aside，空集合占位防穿透）
- 🖼️ 图片：MinIO 对象存储上传（写文章支持拖拽上传封面）
- ⚡ **多级缓存**：Caffeine(L1) + Redis(L2)；高频浏览量经 **Kafka** 异步聚合落库
- 🛡️ 治理 & 可观测：Nacos 注册/配置、Gateway 网关鉴权、Sentinel 限流、OpenFeign、RabbitMQ、**OpenTelemetry 链路追踪 → Grafana Tempo**、**Prometheus + Grafana 监控大盘**
- 🪵 **统一日志**：全服务 Logback 滚动文件日志（全量/错误分离、gz 压缩、按天+大小滚动）；请求日志过滤器记录每请求方法/路径/状态/耗时 + traceId（MDC），慢请求自动 WARN 告警

---

## 🏗️ 架构总览

```
                         ┌─────────────────────────┐
        浏览器  ───────▶ │   blog-frontend (Nginx)  │  React + Vite + Tailwind
                         └───────────┬─────────────┘
                                     │ /api/*  反向代理（含 SSE 流式）
                         ┌───────────▼─────────────┐
                         │   blog-gateway  :8080    │  Spring Cloud Gateway
                         │  JWT 校验 / 路由 / 限流   │  + Sentinel
                         └─────┬─────┬─────┬────┬───┘
              ┌────────────────┘     │     │    └────────────────┐
   ┌──────────▼────────┐ ┌──────────▼──┐ ┌▼─────────────┐ ┌──────▼──────┐
   │ blog-auth   :8081 │ │ blog-content│ │ blog-search  │ │ blog-ai     │
   │ Security/JWT      │ │  :8082      │ │  :8083       │ │  :8084      │
   │ MySQL/Redis       │ │ 多级缓存    │ │ Qdrant 向量  │◀┤ RAG/AI 写作 │
   └───────────────────┘ │ Kafka 生产  │ │ ONNX 向量化  │ │ Spring AI   │
                         │ RabbitMQ ───┼─▶(向量同步)     │ └──────┬──────┘
                         └─────────────┘  OpenFeign 召回 ┘     大模型网关
        ┌──────────────────────────────────────────────────────────────┐
        │  Nacos · MySQL · Redis · Caffeine · RabbitMQ · Kafka · Qdrant │
        │  MinIO · Sentinel · Tempo · Prometheus · Grafana             │
        └──────────────────────────────────────────────────────────────┘
```

---

## 🧰 技术栈

### 后端
| 类别 | 选型 |
|------|------|
| 语言 / 构建 | Java 21 · Maven 多模块 |
| 框架 | Spring Boot 3.5.3 |
| 微服务 | Spring Cloud 2025.0.0 · Spring Cloud Alibaba 2023.0.3.3 |
| 注册/配置 | Nacos 2.4 |
| 网关 | Spring Cloud Gateway (Server WebFlux) |
| 鉴权 | Spring Security + JWT (jjwt) |
| 服务调用 | OpenFeign + LoadBalancer |
| 流量防护 | Sentinel |
| ORM | MyBatis-Plus 3.5 |
| 多级缓存 | Caffeine (L1) + Redis/Redisson (L2) |
| 消息 | RabbitMQ（命令/同步）· Kafka（高频事件流） |
| 向量检索 | Qdrant + Spring AI VectorStore + 本地 ONNX 向量化 (all-MiniLM-L6-v2) |
| 对象存储 | MinIO |
| 可观测性 | Micrometer Tracing + **OpenTelemetry (OTLP) → Grafana Tempo** · Prometheus + Grafana |
| AI | Spring AI 1.0.0（OpenAI 兼容）· 流式生成 · RAG |
| 文档 | Knife4j (OpenAPI 3) |

### 前端
React 19 · TypeScript 5.9 · Vite 8 (Rolldown) · TailwindCSS 4（CSS-first）· TanStack Query 5 · Zustand 5 · React Router 7 · Motion 12 · react-markdown · Axios

---

## 🚀 快速开始

> 前置：已安装 **Docker Desktop**（Linux 容器）。首次构建会拉取镜像，请耐心等待。

### 方式一：一键脚本
```powershell
# Windows
pwsh start.ps1
```
```bash
# Linux / macOS
bash start.sh
```

### 方式二：手动两步
```bash
# 1) 启动全部中间件（创建 blog-net 网络）
docker compose -f docker-compose.middleware.yml up -d

# 2) 构建并启动 6 个微服务 + 前端
docker compose -f docker-compose.app.yml up -d --build

# 3) (可选) 发布 Nacos 共享配置
pwsh deploy/nacos/publish-config.ps1
```

启动完成后访问 **http://localhost:8888** 🎉

---

## 🔌 端口与入口

| 服务 | 地址 | 账号 |
|------|------|------|
| 🌸 博客前台 | http://localhost:8888 | admin / admin123 |
| 🚪 API 网关 | http://localhost:8080 | - |
| 🧭 Nacos | http://localhost:8848/nacos | nacos / nacos |
| 🐰 RabbitMQ | http://localhost:15672 | blog / blog123 |
| 🗄️ MinIO | http://localhost:9001 | minioadmin / minioadmin123 |
| 🛡️ Sentinel | http://localhost:8858 | sentinel / sentinel |
| 🔭 Tempo (链路追踪) | 在 Grafana 中查看 (Explore → Tempo) | - |
| 🧠 Qdrant | http://localhost:6333/dashboard | - |
| 📨 Kafka UI | http://localhost:8889 | - |
| 📊 Prometheus | http://localhost:9090 | - |
| 📈 Grafana | http://localhost:13000 | admin / admin123 |
| 📖 接口文档 | http://localhost:8082/doc.html 等 | - |

> 注：MySQL 容器映射到宿主机 **13307**，Grafana 映射到 **13000**。
> （宿主端口 3306/3307、3000 易与本机 MySQL 或 Windows 动态保留端口段冲突，故上移到 13307 / 13000；容器内部端口不变，服务间通信走 Docker 内网不受影响。）

---

## 👤 默认账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 (夏目贵志) |
| natsume | natsume123 | 普通用户 (猫咪老师) |

---

## 🤖 Spring AI · 大模型

`blog-ai` 通过 OpenAI 兼容协议接入大模型，默认 **DeepSeek**（`https://api.deepseek.com`，模型 `deepseek-chat`）。

**后台可视化配置（管理员）**：在「🐱 AI 设置」页可改 base-url / 模型 / 温度 / 密钥并**运行时热生效**（无需重启）——配置持久化于 `t_ai_config`，更新后立即重建 ChatClient。提供 DeepSeek / OpenAI / 本机网关快速预设与连通性测试。

环境变量仍可覆盖默认：`LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY`。
> 🔑 **密钥安全**：`LLM_API_KEY` 不写入仓库——复制 `.env.example` 为 `.env` 并填入真实 key（`.env` 已被 `.gitignore` 忽略）。后台填的密钥仅存服务端数据库；DB 留空时回退到环境变量。

---

## 🛠️ 本地开发（不打包成镜像）

```bash
# 仅启动中间件
docker compose -f docker-compose.middleware.yml up -d

# 后端（IDE 或命令行运行各模块的 Application）
cd backend && mvn clean install -DskipTests
# 依次运行 blog-gateway / blog-auth / blog-content / blog-search / blog-ai

# 前端（Vite 开发服务器，已配置 /api 代理到网关 8080）
cd frontend && npm install && npm run dev   # http://localhost:5173
```
> ⚠️ 本地直跑后端时，若宿主机已有无密码 Redis/MySQL 占用 6379/3306，会与容器冲突；
> 推荐使用 Docker 方式运行后端，或调整端口。

---

## 📁 目录结构
```
blog/
├── backend/                     # Spring Cloud Alibaba 多模块
│   ├── blog-common/             # 统一返回 / 异常 / JWT / 常量 (自动配置 starter)
│   ├── blog-gateway/            # 网关：路由 / 鉴权 / 限流
│   ├── blog-auth/               # 认证：注册 / 登录 / JWT
│   ├── blog-content/            # 内容：文章/评论/标签 · 多级缓存 · Kafka 生产/消费
│   ├── blog-search/             # 搜索：Qdrant 向量库 · 本地 ONNX 向量化 · RabbitMQ 消费
│   ├── blog-ai/                 # AI：Spring AI · 流式写作 · RAG 问答 (Feign 召回)
│   └── Dockerfile               # 通用服务镜像（ARG MODULE）
├── frontend/                    # React + Vite + Tailwind
│   ├── src/{api,components,pages,store,types}
│   ├── Dockerfile / nginx.conf
├── deploy/
│   ├── mysql/init.sql           # 建库建表 + 夏目主题种子数据
│   ├── prometheus/prometheus.yml
│   ├── grafana/provisioning/    # 数据源 + 监控大盘
│   └── nacos/publish-config.ps1 # 发布 Nacos 共享配置
├── docker-compose.middleware.yml
├── docker-compose.app.yml
└── start.ps1 / start.sh
```

---

## 💡 面试讲解要点
- **网关统一鉴权**：Gateway 解析 JWT，剥离客户端伪造的用户头，再透传 `X-User-Id/Name/Role`，下游用 `@CurrentUser` 注入。
- **公共 Starter**：`blog-common` 用 `AutoConfiguration` + `@ConditionalOnWebApplication(SERVLET)` 让全局异常处理只在 Servlet 服务生效，避免污染响应式网关。
- **多级缓存**：文章详情走 Caffeine(L1) → Redis(L2) → MySQL；写操作同时失效两级；展示用浏览量内存自增、落库经 Kafka 异步聚合，读写解耦。
- **双消息中间件分工**：RabbitMQ 负责文章变更这类「命令/同步」事件（可靠、低频）；Kafka 负责浏览行为这类「高吞吐事件流」。
- **向量检索 / RAG**：摒弃纯 ES 的思路，改用 Qdrant 向量库 + Spring AI VectorStore；用本地 ONNX（all-MiniLM-L6-v2）离线向量化，再叠加关键词重排做**中文友好的混合检索**；`blog-ai` 经 OpenFeign 召回 Top-K 文章作为上下文，交大模型生成带引用的回答。
- **Spring AI 落地**：ChatClient 设定「猫咪老师」人格，提供流式写作（SSE）、续写、润色、起标题、推荐标签、摘要与 RAG 问答。
- **服务间调用**：搜索/AI 服务用 OpenFeign + LoadBalancer 调用内容服务（重建索引 / RAG 召回）。
- **可观测性**：Micrometer Tracing + **OpenTelemetry(OTLP)** 上报链路到 **Grafana Tempo**，与 Prometheus 指标、Grafana 大盘统一在一个面板（QPS/P95/JVM + 调用链 + 服务依赖图）；Sentinel 流控降级。
```
