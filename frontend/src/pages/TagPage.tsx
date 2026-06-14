import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { fetchPosts, fetchTags } from '../api/posts'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import ErrorState from '../components/ErrorState'

export default function TagPage() {
  const { id } = useParams()
  const tagId = Number(id)

  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags })
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', 'tag', tagId],
    queryFn: () => fetchPosts({ tagId, current: 1, size: 30 }),
  })

  const tag = tags?.find((t) => t.id === tagId)
  const total = data?.total ?? 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-ink-light">
          <span className="h-px w-10 bg-ink/15" />
          <span className="text-xl">🦋</span>
          <span className="h-px w-10 bg-ink/15" />
        </div>
        <h1 className="brush-title text-4xl text-ink"># {tag?.name || '标签'}</h1>
        <p className="mt-2 text-sm text-ink-soft">共 {total} 篇带着这枚标签的随笔</p>
      </motion.div>

      {/* 标签云：在标签之间切换 */}
      {!!tags?.length && (
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {tags.map((t) => (
            <Link
              key={t.id}
              to={`/tag/${t.id}`}
              className={`rounded-full px-3 py-1 text-sm transition-all ${
                t.id === tagId
                  ? 'bg-matcha text-white shadow-soft'
                  : 'bg-matcha-light/40 text-matcha-deep ring-1 ring-matcha/20 hover:-translate-y-0.5'
              }`}
            >
              # {t.name}
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="标签下的文章加载失败了" onRetry={() => refetch()} />
      ) : data?.records.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.records.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-ink-light">这枚标签下还没有文章 🍃</p>
      )}
    </div>
  )
}
