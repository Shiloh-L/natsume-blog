# 设计：从微服务收敛为模块化单体

- 日期：2026-06-14
- 状态：已批准，待实施
- 分支：`refactor/modular-monolith`

## 背景与动机

当前项目是一个个人博客，最初按"面试展示"目标做成了微服务架构：5 个后端服务 +
12 个中间件容器 + 1 个前端，共 18 个容器。经过评估，得出结论：

- **微服务对个人博客是过度设计**。微服务的三个核心理由（独立团队部署、热点路径独立
  扩容、大规模故障隔离）在单人开发、低流量的个人博客上都不成立。
- 大量中间件是"微服务税"：装了却没有真实业务价值，部分甚至是纯摆设
  （Sentinel 代码中 0 处使用）。
- 真正的目标已从"堆组件的面试项目"转型为"一个真正能用、能部署的个人博客"。

因此本设计的目标是：**收敛为模块化单体（Modular Monolith）**——保留全部真实功能
（文章、社交、认证、搜索、AI），砍掉把它们硬绑成分布式的那层架构壳。

### 关键事实更正

- `blog-search` 的 pom 描述写的是 "Elasticsearch"，但**实际依赖是
  `spring-ai-starter-vector-store-qdrant` + `spring-ai-starter-model-transformers`
  （本地 ONNX 向量化）**。也就是说搜索是**向量语义搜索**，不是 ES 全文检索。
  整个项目**没有 Elasticsearch**，搜索与 AI/RAG 共用同一个 Qdrant。

## 目标架构

单个 Spring Boot 应用，内部按限界上下文分包：

```
blog-app (单一可执行 Spring Boot 应用)
└─ src/main/java/com/natsume/blog/
   ├─ common/   # 统一返回、异常、JWT 工具、CurrentUser 解析
   ├─ auth/     # 登录、注册、JWT 签发（独立库 blog_auth）
   ├─ post/     # 文章、分类、标签、评论、文件上传
   ├─ social/   # 关注、收藏、动态(Moment)、通知
   ├─ search/   # 向量索引 + 语义搜索（Qdrant + ONNX）
   ├─ ai/       # AI 助手、RAG、AI 配置热加载
   └─ BlogApplication.java  # 唯一启动类
```

模块边界仍清晰（每模块独立子包，内部 controller/service/mapper/entity 分层），
可继续讲 DDD 限界上下文；区别是它们运行在**同一 JVM**，模块间通过**普通方法调用**
或 **Spring 进程内事件**通信，而非 Feign / MQ。

## 通信替换（迁移核心）

### Feign 跨服务调用 → 直接注入 Service

| 原 Feign | 替换 |
| --- | --- |
| `AuthClient.batch(ids)`（post→auth 批量取用户） | 注入 `AuthService.batchBrief(ids)` |
| `ContentClient.indexData()`（search→content 拉索引数据） | 注入 `PostService.indexData()` |
| `SearchClient.retrieve(query, topK)`（ai→search RAG 检索） | 注入 `VectorSearchService.retrieve(...)` |

3 个 Feign 接口删除；对应的 `/internal/index-data`、`/api/search/retrieve` 内部
HTTP 接口可删（改为纯方法调用）。

### MQ 事件 → Spring 进程内事件

所有异步事件统一收敛到 `ApplicationEventPublisher` + `@EventListener`，异步监听加
`@Async`（配独立线程池），需要可靠性的写链路用
`@TransactionalEventListener(phase = AFTER_COMMIT)`。

| 原 MQ 链路 | 替换 |
| --- | --- |
| Kafka 通知事件（评论/回复/点赞 → 站内信落库） | `NotificationEvent` + `@Async @EventListener` |
| Kafka 浏览量事件（PostViewed → 异步自增 view） | `PostViewedEvent` + `@Async @EventListener` |
| RabbitMQ 索引同步（发/改/删文 → 同步 Qdrant 向量） | `PostChangedEvent` + `@Async @TransactionalEventListener(AFTER_COMMIT)` |

设计理念：同样的"事件驱动"思想，去掉不必要的网络与运维成本。模块间通过事件类解耦，
post 模块 publish、search/social 模块订阅，编译期互不 import，比 Feign 更干净。

### 网关 → 单体 Filter

Gateway 的 `AuthGlobalFilter`（JWT 解析 + 注入用户上下文）→ 单体内一个
`OncePerRequestFilter`。删除整个 `blog-gateway` 模块。

## 数据库与配置

### 数据库：保留双库，语义升级为"模块内库"

- `blog_auth`：`auth` 模块专用，其他模块不直接读其表，只通过 `AuthService` 访问
  （保留 DB-per-context 边界感）。
- `blog`：post / social / ai / search 共用业务库，同一事务管理器。
- **核心收益**：跨模块写操作可用单个本地 `@Transactional` 保证强一致。
  例："发文"在事务内，"建索引"用 `@TransactionalEventListener(AFTER_COMMIT)`
  提交后触发。ai 直连 content 库的耦合问题随同进程自动消失（改走 Service）。

### 配置：彻底去 Nacos，回归单一 application.yml

- 删除所有 `bootstrap.yml` 及 nacos discovery/config 依赖。
- 5 份 application.yml 合并为 1 份（按模块分 section）。
- 环境变量（MYSQL_HOST、REDIS_PASSWORD、LLM_API_KEY 等）维持，仍走 `.env` + compose。
- **AI 配置热加载保留**：`t_ai_config` 表 + 运行时重建 ChatClient，不依赖 Nacos，
  原样保留。

## 容器收敛（18 → 8）

| 类别 | 保留容器 |
| --- | --- |
| 业务 | blog-app（8080）、blog-frontend（8888） |
| 存储 | mysql、redis、minio、qdrant |
| 监控 | prometheus、grafana |

**移除的 6 个中间件**：nacos、rabbitmq、kafka、kafka-ui、sentinel、tempo。

**移除的 4 个后端镜像**：gateway、search、ai 独立镜像；auth、content 代码并入 blog-app
（最终后端只产出 `natsume/blog-app:2.0.0` 一个镜像）。

预计内存从 ~4-6GB 降到 ~1-1.5GB，启动从分钟级降到秒级。

## 依赖取舍

**保留**：spring-boot-starter-web、mybatis-plus、mysql、redis、minio(S3)、
Spring AI（qdrant + transformers + openai）、actuator + prometheus、knife4j。

**移除**：nacos discovery/config、openfeign + loadbalancer、sentinel、
micrometer-tracing/otlp(tempo)、kafka、amqp(rabbit)、gateway 全部。

## Maven 结构

```
backend/  (parent pom)
├─ blog-common   (子模块：工具/DTO/异常)
└─ blog-app      (可执行：含 auth/post/social/search/ai 包 + 唯一 main)
```

原 5 个业务模块的 pom、`*Application.java`、`bootstrap.yml` 删除，代码按包迁入 blog-app。

## 迁移步骤（增量、每步可验证、随时可回滚）

全程在新分支 `refactor/modular-monolith` 进行，主干不动。每步构建通过 + 冒烟测试再进
下一步。

1. **建骨架**：parent pom 改为 `blog-common` + `blog-app`；blog-app 聚合依赖
   （去掉 nacos/feign/sentinel/kafka/rabbit/tempo）。
2. **搬代码**：5 服务的 controller/service/mapper/entity 按模块包迁入 blog-app；
   合并配置为单 application.yml；单一 main 类。
3. **断 Feign**：删 3 个 Feign 接口 → 改注入对应 Service；删内部 HTTP 接口。
4. **换事件**：5 个 MQ 生产/消费 → `ApplicationEventPublisher` +
   `@Async @TransactionalEventListener`；配 `@EnableAsync` + 线程池。
5. **去网关**：gateway JWT 校验搬进 blog-app 的 `OncePerRequestFilter`；删 gateway 模块。
6. **改 compose**：middleware 删 6 容器；app 删 4 镜像 + 相关 env；前端反代改向 blog-app。
7. **整体冒烟**：8 容器全起，跑通登录/发文/评论/关注/通知/搜索/AI/上传/监控 9 条主链路。

## 风险与对策

| 风险 | 对策 |
| --- | --- |
| 包冲突/类重名（5 模块合并） | 各模块独立子包，扫描根包统一 |
| 跨模块 bean 循环依赖 | 写链路用 Spring Event 解耦；查询链路单向注入（social→post→auth） |
| MyBatis-Plus 多包 mapper 扫描 | 统一 `@MapperScan("com.natsume.blog.**.mapper")` |
| 双数据源（blog + blog_auth） | 保留现有多数据源配置；auth 表走 blog_auth，其余走 blog |
| AI/ONNX 模型首次加载慢 | 保留 `search-model-cache` volume |
| 回滚 | 全程新分支操作，主干不动 |

## 成功标准

- 后端从 5 个服务收敛为 1 个 `blog-app`，容器从 18 降到 8。
- 9 条主链路（登录/发文/评论/关注/通知/搜索/AI/上传/监控）全部冒烟通过。
- 无 Nacos / Feign / Kafka / RabbitMQ / Sentinel / Tempo / Gateway 残留依赖。
- AI 配置热加载、Grafana 监控大盘仍可用。
- 前端功能不变，可正常访问。

## 非目标（YAGNI）

- 不引入 Seata、Redisson、分布式调度等"加法"组件。
- 不重写前端（仅在必要时改 nginx 反代目标）。
- 不做与本次收敛无关的重构。
