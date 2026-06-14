import { motion } from 'motion/react'
import { usePageTitle } from '../hooks/usePageTitle'

const modules = [
  { name: 'auth', desc: 'Spring Security + JWT · 注册登录', icon: '🔐' },
  { name: 'content', desc: '文章/评论/标签/社交 · 多级缓存 · 进程内事件', icon: '📝' },
  { name: 'search', desc: 'Qdrant 向量检索 · 本地 ONNX 向量化', icon: '🔍' },
  { name: 'ai', desc: 'Spring AI · AI 写作 + RAG 问答', icon: '🐱' },
  { name: 'common', desc: '统一返回 / 异常 / JWT / @CurrentUser', icon: '🧩' },
]

const middleware = [
  { name: 'MySQL 8', desc: '主数据存储（单库）' },
  { name: 'Redis', desc: 'L2 缓存 / 会话 / 收藏集合' },
  { name: 'Caffeine', desc: 'L1 本地缓存（多级缓存）' },
  { name: 'Qdrant', desc: '向量数据库 · 语义检索/RAG' },
  { name: 'MinIO', desc: '对象存储 · 图片' },
  { name: 'Prometheus', desc: '指标采集' },
  { name: 'Grafana', desc: '可视化监控大盘' },
  { name: 'Spring AI', desc: '大模型接入 · 本地向量化' },
]

const frontend = ['React 19', 'TypeScript', 'Vite 8', 'Tailwind 4', 'TanStack Query', 'Zustand', 'React Router 7', 'Motion', 'SSE 流式']

export default function AboutPage() {
  usePageTitle('关于')
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="brush-title text-4xl text-ink">这座小屋的架构</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
          「不是所有牵绊都要拆开才算各司其职——把名字收回到一处，反而更清楚谁是谁。」
          这是一个用 <span className="text-matcha-deep">Spring Boot</span> 模块化单体 +
          <span className="text-matcha-deep"> React</span> 打造的个人博客：
          按限界上下文分包、各司其职，却共处同一屋檐，仅需 8 个容器即可安家。
        </p>
      </motion.div>

      <section className="mt-12">
        <h2 className="brush-title mb-5 text-2xl text-ink">🌿 模块（限界上下文）</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((s, i) => (
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
          <li>① 浏览器请求经 <b>Nginx</b> 反代到单体 <b>blog-app</b>，<b>JwtAuthFilter</b> 校验 JWT 并还原登录用户</li>
          <li>② 模块间是<b>普通方法调用</b>（同一 JVM，无网络开销），用 <b>@CurrentUser</b> 注入当前用户</li>
          <li>③ 文章详情走多级缓存 <b>Caffeine(L1)+Redis(L2)</b>，未命中再查 <b>MySQL</b></li>
          <li>④ 高频浏览量、站内信经 <b>Spring 进程内事件</b>（@Async）异步落库，读写解耦</li>
          <li>⑤ 发文提交后经 <b>@TransactionalEventListener</b>，用<b>本地 ONNX</b> 向量化写入 <b>Qdrant</b>，提供语义检索与 <b>RAG</b> 召回</li>
          <li>⑥ <b>Spring AI</b> 召唤猫咪老师写文章/答疑；<b>Prometheus + Grafana</b> 观测全链路</li>
        </ol>
      </section>
    </div>
  )
}
