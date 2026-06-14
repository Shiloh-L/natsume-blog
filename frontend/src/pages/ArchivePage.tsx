import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { fetchArchive, type ArchiveItem } from '../api/posts'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import { usePageTitle } from '../hooks/usePageTitle'

interface YearGroup {
  year: string
  items: ArchiveItem[]
}

function groupByYear(items: ArchiveItem[]): YearGroup[] {
  const map = new Map<string, ArchiveItem[]>()
  for (const it of items) {
    const year = (it.createTime || '').slice(0, 4) || '更早'
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(it)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, list]) => ({ year, items: list }))
}

export default function ArchivePage() {
  usePageTitle('长卷')
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['archive'], queryFn: fetchArchive })

  const groups = useMemo(() => groupByYear(data || []), [data])
  const total = data?.length ?? 0

  if (isLoading) return <Loading />
  if (isError) return <ErrorState message="长卷加载失败了" onRetry={() => refetch()} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-ink-light">
          <span className="h-px w-10 bg-ink/15" />
          <span className="text-xl">🍂</span>
          <span className="h-px w-10 bg-ink/15" />
        </div>
        <h1 className="brush-title text-4xl text-ink">光阴长卷</h1>
        <p className="mt-2 text-sm text-ink-soft">至今写下 {total} 篇随笔，都在这卷时光里</p>
      </motion.div>

      {total === 0 ? (
        <div className="py-16 text-center text-ink-light">
          <p>长卷还空着，去写下第一篇吧 ✍️</p>
          <Link to="/write" className="ghibli-btn-ghost mt-4 inline-flex">提笔写作</Link>
        </div>
      ) : (
        <div className="relative">
          {/* 时间藤蔓主线 */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-matcha/50 via-matcha-light/60 to-transparent" />

          {groups.map((g, gi) => (
            <motion.section
              key={g.year}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08 }}
              className="mb-8"
            >
              {/* 年份节点 */}
              <div className="mb-4 flex items-center gap-3">
                <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-matcha shadow ring-4 ring-paper" />
                <h2 className="brush-title text-3xl text-matcha-deep">{g.year}</h2>
                <span className="text-xs text-ink-light">· {g.items.length} 篇</span>
              </div>

              {/* 该年文章 */}
              <ul className="ml-[3px] space-y-1 border-l border-transparent pl-7">
                {g.items.map((it) => (
                  <li key={it.id} className="group relative">
                    {/* 小圆点 */}
                    <span className="absolute -left-[26px] top-3 h-2 w-2 rounded-full bg-matcha-light ring-2 ring-paper transition-colors group-hover:bg-nyanko" />
                    <Link
                      to={`/post/${it.id}`}
                      className="flex items-baseline gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/60"
                    >
                      <span className="shrink-0 font-mono text-xs text-ink-light">
                        {it.createTime?.slice(5, 10)}
                      </span>
                      <span className="font-serif text-ink transition-colors group-hover:text-matcha-deep line-clamp-1">
                        {it.title}
                      </span>
                      {it.categoryName && (
                        <span className="ml-auto hidden shrink-0 rounded-full bg-matcha-light/40 px-2 py-0.5 text-[11px] text-matcha-deep sm:inline">
                          {it.categoryName}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  )
}
