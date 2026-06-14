import { motion } from 'motion/react'

const services = [
  { name: 'blog-gateway', desc: 'Spring Cloud Gateway · 路由/鉴权/限流', icon: '🚪' },
  { name: 'blog-auth', desc: 'Spring Security + JWT · 注册登录', icon: '🔐' },
  { name: 'blog-content', desc: 'MyBatis-Plus · 多级缓存 · Kafka 事件', icon: '📝' },
  { name: 'blog-search', desc: 'Qdrant 向量检索 · 本地 ONNX 向量化', icon: '🔍' },
  { name: 'blog-ai', desc: 'Spring AI · AI 写作 + RAG 问答', icon: '🐱' },
]

const middleware = [
  { name: 'Nacos', desc: '服务注册 & 配置中心' },
  { name: 'MySQL 8', desc: '主数据存储' },
  { name: 'Redis', desc: 'L2 缓存 / 分布式锁 / Token' },
  { name: 'Caffeine', desc: 'L1 本地缓存（多级缓存）' },
  { name: 'RabbitMQ', desc: '文章变更 · 向量同步' },
  { name: 'Kafka', desc: '高频浏览行为事件流' },
  { name: 'Qdrant', desc: '向量数据库 · 语义检索/RAG' },
  { name: 'MinIO', desc: '对象存储 · 图片' },
  { name: 'Sentinel', desc: '流量防护 / 熔断降级' },
  { name: 'Grafana Tempo', desc: 'OpenTelemetry 链路追踪' },
  { name: 'Prometheus', desc: '指标采集' },
  { name: 'Grafana', desc: '可视化监控大盘' },
]

const frontend = ['React 19', 'TypeScript', 'Vite 8', 'Tailwind 4', 'TanStack Query', 'Zustand', 'React Router 7', 'Motion', 'SSE 流式']

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="brush-title text-4xl text-ink">这座桥的架构</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
          「把单体应用拆成微服务，就像把名字一个个归还——各司其职，又彼此相连。」
          这是一个用 <span className="text-matcha-deep">Spring Cloud Alibaba</span> 全家桶 +
          <span className="text-matcha-deep"> React</span> 打造的微服务博客系统。
        </p>
      </motion.div>

      <section className="mt-12">
        <h2 className="brush-title mb-5 text-2xl text-ink">🌿 微服务</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.06 }}
              className="paper-card p-5"
            >
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-2 font-mono text-sm font-bold text-matcha-deep">{s.name}</div>
              <div className="mt-1 text-sm text-ink-soft">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="brush-title mb-5 text-2xl text-ink">🏮 中间件</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {middleware.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white/60 p-4 text-center ring-1 ring-ink/5"
            >
              <div className="font-bold text-ink">{m.name}</div>
              <div className="mt-1 text-xs text-ink-light">{m.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="brush-title mb-5 text-2xl text-ink">🦋 前端全家桶</h2>
        <div className="flex flex-wrap gap-2">
          {frontend.map((f) => (
            <span key={f} className="tag-chip text-sm">{f}</span>
          ))}
        </div>
      </section>

      <section className="mt-12 paper-card p-6">
        <h2 className="brush-title mb-4 text-2xl text-ink">🍃 一次请求的旅程</h2>
        <ol className="space-y-2 text-sm text-ink-soft">
          <li>① 浏览器请求经 <b>Gateway</b> 统一入口，校验 JWT 并透传用户信息</li>
          <li>② Gateway 通过 <b>Nacos</b> 发现服务，<b>LoadBalancer</b> 负载均衡转发</li>
          <li>③ 内容服务多级缓存 <b>Caffeine(L1)+Redis(L2)</b>，未命中再查 <b>MySQL</b></li>
          <li>④ 高频浏览量经 <b>Kafka</b> 异步聚合落库；文章变更经 <b>RabbitMQ</b> 通知搜索服务</li>
          <li>⑤ 搜索服务用 <b>本地 ONNX</b> 向量化写入 <b>Qdrant</b>，提供语义检索与 <b>RAG</b> 召回</li>
          <li>⑥ <b>Spring AI</b> 召唤猫咪老师写文章/答疑；<b>Sentinel</b> 限流，<b>OpenTelemetry → Tempo / Prometheus / Grafana</b> 观测全链路</li>
        </ol>
      </section>
    </div>
  )
}
