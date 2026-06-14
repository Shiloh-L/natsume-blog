import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchMoments } from '../api/moments'
import MomentComposer from '../components/MomentComposer'
import MomentEntry from '../components/MomentEntry'
import Loading from '../components/Loading'
import type { Moment } from '../types/moment'

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchMoments(1, 30)
      .then((res) => setMoments(res.records))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* 标题：像一本手帐的扉页 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-ink-light">
          <span className="h-px w-10 bg-ink/15" />
          <span className="text-xl">🍃</span>
          <span className="h-px w-10 bg-ink/15" />
        </div>
        <h1 className="brush-title text-4xl text-ink">光阴小记</h1>
        <p className="mt-2 text-sm text-ink-soft">把每一个温柔的瞬间，夹进时光的书页里</p>
      </motion.div>

      <MomentComposer onPosted={load} />

      {loading ? (
        <Loading text="正在翻开时光的书页…" />
      ) : moments.length === 0 ? (
        <p className="py-16 text-center text-ink-light">还没有记下什么，写下第一页吧 🍃</p>
      ) : (
        // 时间线主轴：一条流动的藤蔓线
        <div className="relative mt-4">
          <span className="absolute bottom-2 left-[3.05rem] top-2 w-px bg-gradient-to-b from-matcha-light/0 via-matcha-light/60 to-matcha-light/0 sm:left-[4.55rem]" />
          <div className="space-y-8">
            {moments.map((m, i) => (
              <MomentEntry key={m.id} moment={m} index={i} onChange={load} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
