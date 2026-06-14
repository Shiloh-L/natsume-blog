# 🏮 夏目友人帐 · 温柔小屋 — 模块化单体个人博客

> 「不是所有牵绊都要拆开才算各司其职——把名字收回到一处，反而更清楚谁是谁。」

一个以 **《夏目友人帐》水彩治愈风** 为主题、并融入 **宫崎骏式森林与精灵** 氛围的全栈个人博客。
后端是一个 **结构清晰的模块化单体（Modular Monolith）**，按限界上下文分包（认证 / 文章 / 社交 / 搜索 / AI）；
前端采用 **React 全家桶**。整套系统仅需 **8 个容器** 即可运行，能轻松部署到一台廉价 VPS。

> 📌 **关于架构的取舍**：本项目最初是「Spring Cloud Alibaba 微服务全家桶」（18 容器）。
> 经评估，个人博客并不具备微服务的三个前提（多团队独立部署、热点路径独立扩容、大规模故障隔离），
> 于是 **主动做减法**，收敛为模块化单体：保留全部功能（含 AI / 语义搜索 / 监控），
> 移除「微服务税」（Nacos / Gateway / Feign / Sentinel / Kafka / RabbitMQ / Tempo）。
> 事件驱动思想保留——只是从「跨进程 MQ」降级为「进程内 Spring 事件」，去掉了不必要的网络与运维成本。
> 详见 [`docs/superpowers/specs/2026-06-14-modular-monolith-design.md`](docs/superpowers/specs/2026-06-14-modular-monolith-design.md)。

> ⚠️ 版权说明：本项目仅取「夏目友人帐 / 吉卜力」的 **水彩、自然、柔和** 美学风格，
> 所有插画（森林守护者、草木精灵、场景封面等）均为 **原创 SVG**，**未使用任何受版权保护的角色或动画画面**。
> 未上传封面时，使用原创水彩场景图（青丘 / 黄昏森林 / 星夜 / 海边 / 雨林 / 花田）按文章稳定分配。

---

## ✨ 功能特性

- 🏡 **首页（Butterfly 卡片式布局）**：沉浸式水彩 banner（层叠山丘 + 暖阳 + 流云 + 飞蝶 + 滚动文案）、左文章流 / 右侧栏（站长卡 · 公告 · 分类 · 标签云 · 小屋资讯）双栏布局
- 📱 **移动端适配**：响应式断点全覆盖、移动端汉堡抽屉导航（搜索 + 全部入口 + 触摸友好）、双栏自动堆叠
- 📝 文章：发布 / 编辑 / 删除、Markdown 渲染、分类、标签、置顶、浏览量、点赞；写文章页支持双栏编辑、工具栏、一键成文、主题化下拉、新建标签/分类
- 🍂 **文章归档（光阴长卷）**：按年份分组的水彩时间线，一览全部随笔
- 🏷️ **标签聚合页**：点任意标签进入 `/tag/:id` 浏览该标签下全部文章，顶部标签云一键切换
- 📖 **阅读体验（Butterfly 风格）**：卷轴式悬浮目录 TOC（滚动高亮 + 点击平滑跳转）、字数统计、预计阅读时长、顶部阅读进度条
- 💬 评论：二级评论树、登录后留言
- 🔐 认证：注册 / 登录、JWT、Spring Security、RBAC 角色
- 🧠 **向量语义搜索**：Qdrant 向量库 + 本地 ONNX 向量化 + 关键词混合重排（中文友好）
- ✍️ **AI 写作**：流式生成整篇文章、续写、润色、起标题、推荐标签、生成摘要（Spring AI）
- 🐱 **RAG 智能问答**：基于博客全文检索召回 + 大模型生成，答案附引用出处
- 🔔 **消息通知**：评论/回复/点赞/结缘触发站内信，基于 **Spring 进程内事件**异步落库，导航栏未读红点 + 下拉
- 🦋 **结缘 · 友人帐**：与作者结缘 / 解缘、友人与牵挂数、「友人近况」聚合所结缘作者的最新文章，结缘即推送站内信
- 🍁 **收藏 · 藏书阁**：给珍视的文章夹上书签收藏，「藏书阁」集中回看；收藏态以 **Redis Set** 缓存（Cache-Aside，空集合占位防穿透）
- 🖼️ 图片：MinIO 对象存储上传（写文章支持拖拽上传封面）
- ⚡ **多级缓存**：Caffeine(L1) + Redis(L2)；高频浏览量经 **进程内异步事件**聚合落库
- 📈 **可观测性**：Prometheus + Grafana 监控大盘（请求速率/错误率/P95·P99 延迟/最慢接口 Top10/JVM·CPU/日志级别/连接池）
- 🪵 **统一日志**：Logback 滚动文件日志（全量/错误分离、gz 压缩、按天+大小滚动）；请求日志过滤器记录每请求方法/路径/状态/耗时，慢请求自动 WARN 告警

---

## 🏗️ 架构总览

```
                       ┌──────────────────────────┐
      浏览器  ───────▶ │  blog-frontend (Nginx)    │  React + Vite + Tailwind
                       └────────────┬─────────────┘
                                    │ /api/*  反向代理（含 SSE 流式）
                       ┌────────────▼─────────────────────────────────┐
                       │            blog-app  :8080                    │
                       │      单一 Spring Boot 模块化单体               │
                       │  JwtAuthFilter（解析 JWT / 透传用户 / 保护写）  │
                       │  ┌─────────┐                                  │
                       │  │ auth    │  登录 / 注册 / JWT / Security      │
                       │  │ content │  文章 / 评论 / 标签 / 社交 / 文件   │
                       │  │ search  │  Qdrant 向量 + 本地 ONNX 向量化    │
                       │  │ ai      │  Spring AI 写作 / RAG 问答         │
                       │  └─────────┘  模块间：方法调用 + Spring 进程内事件 │
                       └───┬─────────────────────────────────────┬─────┘
                           │                                     │
        ┌──────────────────▼──────────────────┐      ┌───────────▼───────────┐
        │ MySQL · Redis · MinIO · Qdrant       │      │ Prometheus · Grafana   │
        └──────────────────────────────────────┘      └────────────────────────┘
```

**事件驱动（进程内）**：发文/改文/删文 → `@TransactionalEventListener(AFTER_COMMIT)` 异步同步 Qdrant 向量；
评论/点赞/结缘 → `@Async @EventListener` 异步落库站内信；浏览量 → 异步聚合自增。无需任何消息中间件。

---

## 🧰 技术栈

### 后端
| 类别 | 选型 |
|------|------|
| 语言 / 构建 | Java 21 · Maven 多模块（blog-common + blog-app） |
| 框架 | Spring Boot 3.5.3 |
| 架构 | 模块化单体，按限界上下文分包；单一可执行 Jar |
| 鉴权 | Spring Security + JWT (jjwt)；自定义 `JwtAuthFilter` 统一解析 |
| ORM | MyBatis-Plus 3.5 |
| 多级缓存 | Caffeine (L1) + Redis/Redisson (L2) |
| 事件驱动 | Spring `ApplicationEventPublisher` + `@Async` / `@TransactionalEventListener`（替代 Kafka/RabbitMQ） |
| 向量检索 | Qdrant + Spring AI VectorStore + 本地 ONNX 向量化 (all-MiniLM-L6-v2) |
| 对象存储 | MinIO |
| 可观测性 | Micrometer + Prometheus + Grafana（含 P95/P99 直方图） |
| AI | Spring AI 1.0.0（OpenAI 兼容）· 流式生成 · RAG |
| 文档 | Knife4j (OpenAPI 3) |

### 前端
React 19 · TypeScript 5.9 · Vite 8 (Rolldown) · TailwindCSS 4（CSS-first）· TanStack Query 5 · Zustand 5 · React Router 7（路由懒加载）· Motion 12 · react-markdown · Axios

---

## 🚀 快速开始

> 前置：已安装 **Docker Desktop**（Linux 容器）。首次构建会拉取镜像，请耐心等待。
> AI 密钥：复制 `.env.example` 为 `.env` 并填入 `LLM_API_KEY`（`.env` 已被 `.gitignore` 忽略）。

```bash
# 1) 启动中间件（创建 blog-net 网络）：mysql / redis / minio / qdrant / prometheus / grafana
docker compose -f docker-compose.middleware.yml up -d

# 2) 构建并启动后端单体 + 前端
docker compose -f docker-compose.app.yml up -d --build
```

启动完成后访问 **http://localhost:8888** 🎉

---

## 🔌 端口与入口

| 服务 | 地址 | 账号 |
|------|------|------|
| 🌸 博客前台 | http://localhost:8888 | admin / admin123 |
| 🚪 后端 API | http://localhost:8080 | - |
| 📖 接口文档 | http://localhost:8080/doc.html | - |
| 🗄️ MinIO | http://localhost:9001 | minioadmin / minioadmin123 |
| 🧠 Qdrant | http://localhost:6333/dashboard | - |
| 📊 Prometheus | http://localhost:9090 | - |
| 📈 Grafana | http://localhost:13000 | admin / admin123 |

> 注：MySQL 容器映射到宿主机 **13307**，Grafana 映射到 **13000**。
> （宿主端口 3306/3307、3000 易与本机 MySQL 或 Windows 动态保留端口段冲突，故上移；容器内部端口不变，服务间通信走 Docker 内网不受影响。）

---

## 👤 默认账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 (夏目贵志) |
| natsume | natsume123 | 普通用户 (猫咪老师) |

---

## 🤖 Spring AI · 大模型

`ai` 模块通过 OpenAI 兼容协议接入大模型，默认 **DeepSeek**（`https://api.deepseek.com`，模型 `deepseek-chat`）。

**后台可视化配置（管理员）**：在「🐱 AI 设置」页可改 base-url / 模型 / 温度 / 密钥并**运行时热生效**（无需重启）——配置持久化于 `t_ai_config`，更新后立即重建 ChatClient。提供 DeepSeek / OpenAI / 本机网关快速预设与连通性测试。

环境变量仍可覆盖默认：`LLM_BASE_URL` / `LLM_MODEL` / `LLM_API_KEY`。
> 🔑 **密钥安全**：`LLM_API_KEY` 不写入仓库——复制 `.env.example` 为 `.env` 并填入真实 key。后台填的密钥仅存服务端数据库；DB 留空时回退到环境变量。
> 🧠 **向量化与聊天分离**：聊天走 OpenAI 兼容网关，向量化走本地 ONNX（`spring.ai.model.embedding=transformers`），两者并存且不互相依赖。

---

## 🛠️ 本地开发（不打包成镜像）

```bash
# 仅启动中间件
docker compose -f docker-compose.middleware.yml up -d

# 后端（IDE 或命令行运行单体）
cd backend && mvn clean install -DskipTests
java -jar blog-app/target/blog-app.jar      # http://localhost:8080

# 前端（Vite 开发服务器，已配置 /api 代理到 8080）
cd frontend && npm install && npm run dev    # http://localhost:5173
```

---

## 📁 目录结构
```
blog/
├── backend/                     # Maven 多模块
│   ├── blog-common/             # 统一返回 / 异常 / JWT / @CurrentUser (自动配置 starter)
│   ├── blog-app/                # 模块化单体（唯一可执行）
│   │   └── src/main/java/com/natsume/blog/
│   │       ├── config/          # 单体级配置：JwtAuthFilter / MyBatis-Plus / OpenAPI / Async
│   │       ├── auth/            # 认证：注册 / 登录 / JWT / Security
│   │       ├── content/         # 内容 + 社交：文章/评论/标签/关注/收藏/动态/通知 · 多级缓存 · 进程内事件
│   │       ├── search/          # 搜索：Qdrant 向量库 · 本地 ONNX 向量化
│   │       └── ai/              # AI：Spring AI · 流式写作 · RAG 问答
│   └── Dockerfile               # 通用服务镜像（ARG MODULE=blog-app）
├── frontend/                    # React + Vite + Tailwind
│   ├── src/{api,components,pages,store,types}
│   ├── Dockerfile / nginx.conf
├── deploy/
│   ├── mysql/init.sql           # 建库建表 + 夏目主题种子数据（单库 blog）
│   ├── prometheus/prometheus.yml
│   └── grafana/provisioning/    # 数据源 + 监控大盘
├── docs/superpowers/specs/      # 设计文档（含模块化单体收敛方案）
├── docker-compose.middleware.yml
└── docker-compose.app.yml
```

---

## 💡 面试讲解要点
- **架构判断力（做减法）**：能识别个人博客不满足微服务前提，主动从 18 容器收敛为 8 容器的模块化单体；并能清晰说明「什么场景才该拆微服务」。比堆砌组件更稀缺的能力。
- **模块化单体边界**：按限界上下文分包（auth / content / search / ai），模块间通过方法调用与 **Spring 进程内事件** 解耦——发布方与订阅方编译期互不 import，靠事件类解耦，比 Feign 更干净。
- **事件驱动 ≠ 必须上 MQ**：用 `ApplicationEventPublisher` + `@Async @TransactionalEventListener(AFTER_COMMIT)` 实现「发文提交后再同步向量索引」「评论后异步落库站内信」，同样的事件驱动思想，去掉跨进程网络与运维成本。
- **统一鉴权**：去掉网关后，用单体内 `JwtAuthFilter`（`OncePerRequestFilter`）解析 JWT、剥离伪造用户头、以 `X-User-*` 透传，下游 `@CurrentUser` 注入；接入 Spring Security 过滤器链。
- **单库单事务的优势**：收敛后跨模块写操作可用一个本地 `@Transactional` 保证强一致，避免了微服务下的分布式事务复杂度。
- **公共 Starter**：`blog-common` 用 `AutoConfiguration` + `@ConditionalOnWebApplication(SERVLET)` 装配全局异常处理与请求日志。
- **多级缓存**：文章详情走 Caffeine(L1) → Redis(L2) → MySQL；写操作同时失效两级；浏览量内存自增、经进程内异步事件聚合落库，读写解耦。
- **向量检索 / RAG**：Qdrant 向量库 + Spring AI VectorStore，本地 ONNX（all-MiniLM-L6-v2）离线向量化 + 关键词重排做**中文友好的混合检索**；AI 模块直接调用检索服务召回 Top-K 作为上下文，交大模型生成带引用的回答。
- **可观测性**：Micrometer + Prometheus + Grafana 大盘（QPS / 错误率 / P95·P99 直方图 / 最慢接口 Top10 / JVM·CPU / 连接池）。
