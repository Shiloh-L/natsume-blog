import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { fetchPosts } from '../api/posts'
import PostListItem from '../components/PostListItem'
import PostCardSkeleton from '../components/PostCardSkeleton'
import SiteAside from '../components/SiteAside'
import ForestSpirits from '../components/ForestSpirits'
import ErrorState from '../components/ErrorState'

const SUBTITLES = [
  '记录那些只有我能看见的朋友',
  '关于代码、夏天与回忆的点滴',
  '把友人帐里的名字，一个个归还',
  '在八原町的四季里，慢慢生活',
]

function RotatingSubtitle() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SUBTITLES.length), 3200)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="mt-5 h-7 text-base text-ink-soft md:text-lg">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          {SUBTITLES[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-[68vh] items-center overflow-hidden md:min-h-[76vh]">
      {/* 水彩天空 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-light/70 via-paper-warm/40 to-paper" />

      {/* 暖阳 */}
      <motion.div
        className="absolute left-1/2 top-16 h-40 w-40 -translate-x-1/2 rounded-full bg-nyanko/30 blur-2xl md:top-20 md:h-56 md:w-56"
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.9, 0.7] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />

      {/* 流云 */}
      {[
        { top: '18%', size: 'h-10 w-28', dur: 22, delay: 0 },
        { top: '30%', size: 'h-8 w-20', dur: 28, delay: 4 },
        { top: '12%', size: 'h-9 w-24', dur: 25, delay: 9 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className={`absolute ${c.size} rounded-full bg-white/60 blur-md`}
          style={{ top: c.top }}
          initial={{ x: '-15vw' }}
          animate={{ x: '115vw' }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'linear' }}
        />
      ))}

      {/* 飘动的叶与蝶 */}
      {['🦋', '🍃', '🌿', '🍂'].map((e, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-2xl opacity-70 md:text-3xl"
          style={{ left: `${12 + i * 22}%`, top: `${22 + (i % 3) * 16}%` }}
          animate={{ y: [0, -16, 0], rotate: [0, 12, -12, 0] }}
          transition={{ repeat: Infinity, duration: 5 + i, delay: i * 0.6 }}
        >
          {e}
        </motion.span>
      ))}

      {/* 草木精灵（宫崎骏式森林氛围 · 原创） */}
      <ForestSpirits />

      {/* 中央文案 */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="brush-title text-5xl leading-tight text-ink md:text-7xl"
        >
          把名字，<span className="text-matcha-deep">还给你</span>
        </motion.h1>
        <RotatingSubtitle />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center gap-3"
        >
          <a href="#posts" className="ghibli-btn-primary">开始阅读</a>
          <Link to="/moments" className="ghibli-btn-ghost">光阴小记</Link>
        </motion.div>
      </div>

      {/* 层叠山丘 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 240" preserveAspectRatio="none" className="h-32 w-full md:h-48">
          <path fill="#bfd3a8" fillOpacity="0.55" d="M0,160 C240,90 480,200 720,150 C960,100 1200,190 1440,140 L1440,240 L0,240 Z" />
          <path fill="#8fae7b" fillOpacity="0.6" d="M0,190 C260,140 520,230 780,180 C1040,130 1240,210 1440,180 L1440,240 L0,240 Z" />
          <path fill="#5e7c5a" fillOpacity="0.65" d="M0,220 C300,185 600,235 900,210 C1140,190 1320,225 1440,215 L1440,240 L0,240 Z" />
        </svg>
      </div>

      {/* 森灵 · 守在山丘边的森林守护者（原创） */}
      <motion.img
        src="/forest-spirit.svg"
        alt="森林守护者"
        className="pointer-events-none absolute bottom-6 left-3 z-10 h-24 drop-shadow md:bottom-10 md:left-12 md:h-36"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: [16, 6, 16] }}
        transition={{ opacity: { duration: 1 }, y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
      />

      {/* 向下提示 */}
      <motion.a
        href="#posts"
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-2xl text-matcha-deep"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        aria-label="向下滚动"
      >
        ⌄
      </motion.a>
    </section>
  )
}

export default function HomePage() {
  const [page, setPage] = useState(1)
  const size = 6
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts({ current: page, size }),
  })

  return (
    <div>
      <Hero />

      <section id="posts" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* 主列：文章 */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl">🏮</span>
              <h2 className="brush-title text-3xl text-ink">最新随笔</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-matcha/40 to-transparent" />
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <ErrorState message="文章加载失败了" onRetry={() => refetch()} />
            ) : (
              <>
                <div className="space-y-6">
                  {data?.records.map((p, i) => (
                    <PostListItem key={p.id} post={p} index={i} />
                  ))}
                </div>
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="ghibli-btn-ghost disabled:opacity-40"
                  >
                    ← 上一页
                  </button>
                  <span className="text-sm text-ink-light">
                    第 {page} / {data?.pages || 1} 页
                  </span>
                  <button
                    disabled={!!data && page >= data.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="ghibli-btn-ghost disabled:opacity-40"
                  >
                    {isFetching ? '翻页中…' : '下一页 →'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 侧栏 */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SiteAside totalPosts={data?.total ?? 0} />
          </div>
        </div>
      </section>
    </div>
  )
}
