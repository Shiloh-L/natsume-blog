import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchTags } from '../api/posts'

// 小屋开张日，用于计算运行天数
const LAUNCH_DATE = new Date('2026-01-01')

function Card({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string
  icon: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="paper-card p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-serif font-bold text-ink">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

export default function SiteAside({ totalPosts = 0 }: { totalPosts?: number }) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags })

  const runningDays = Math.max(1, Math.floor((Date.now() - LAUNCH_DATE.getTime()) / 86400000))

  return (
    <aside className="space-y-5">
      {/* 站长卡 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="paper-card overflow-hidden"
      >
        <div className="h-20 bg-gradient-to-r from-matcha-light/60 via-sky-light/50 to-paper-warm" />
        <div className="-mt-10 flex flex-col items-center px-5 pb-5 text-center">
          <img
            src="/cat.svg"
            alt="猫咪老师"
            className="h-20 w-20 rounded-full border-4 border-paper-warm bg-paper-warm shadow-soft"
          />
          <div className="brush-title mt-2 text-xl text-ink">夏目友人帐</div>
          <p className="mt-1 text-xs text-ink-soft">名字一旦归还，便化作温柔的风</p>
          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-serif text-lg font-bold text-matcha-deep">{totalPosts}</div>
              <div className="text-[11px] text-ink-light">文章</div>
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-matcha-deep">
                {categories?.length ?? 0}
              </div>
              <div className="text-[11px] text-ink-light">分类</div>
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-matcha-deep">
                {tags?.length ?? 0}
              </div>
              <div className="text-[11px] text-ink-light">标签</div>
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Link to="/archive" className="ghibli-btn-ghost text-sm">🍂 长卷</Link>
            <Link to="/about" className="ghibli-btn-ghost text-sm">小屋</Link>
          </div>
        </div>
      </motion.div>

      {/* 公告 */}
      <Card title="猫咪老师的留言" icon="🏮" delay={0.06}>
        <p className="text-sm leading-relaxed text-ink-soft">
          欢迎来到温柔小屋～在这里翻翻文章、留下足迹，
          也别忘了把友人帐里的名字，一个个还回去。
        </p>
      </Card>

      {/* 分类 */}
      {!!categories?.length && (
        <Card title="妖怪图鉴 · 分类" icon="🍂" delay={0.12}>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/category/${c.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-matcha-light/30 hover:text-matcha-deep"
                >
                  <span>{c.name}</span>
                  <span className="text-ink-light">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 标签云 */}
      {!!tags?.length && (
        <Card title="拾取的标签" icon="🦋" delay={0.18}>
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <Link
                key={t.id}
                to={`/tag/${t.id}`}
                className="tag-chip transition-transform hover:-translate-y-0.5"
                style={{ fontSize: `${0.72 + (i % 4) * 0.07}rem` }}
              >
                # {t.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* 网站资讯 */}
      <Card title="小屋资讯" icon="🌿" delay={0.24}>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li className="flex justify-between">
            <span className="text-ink-light">文章总数</span>
            <span className="font-medium">{totalPosts}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-light">分类数目</span>
            <span className="font-medium">{categories?.length ?? 0}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-light">标签数目</span>
            <span className="font-medium">{tags?.length ?? 0}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-light">小屋运行</span>
            <span className="font-medium">{runningDays} 天</span>
          </li>
        </ul>
      </Card>
    </aside>
  )
}
