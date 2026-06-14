import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fetchMyBookmarks } from '../api/bookmarks'
import PostCard from '../components/PostCard'
import PostCardSkeleton from '../components/PostCardSkeleton'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import type { Post } from '../types'

export default function BookmarksPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchMyBookmarks(1, 24)
      .then((res) => setPosts(res.records))
      .catch(() => toast.error('藏书阁加载失败了'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="py-24 text-center text-ink-soft">
        请先 <Link to="/login" className="text-matcha-deep underline">登录</Link>，再翻开你的藏书阁 🍁
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-ink-light">
          <span className="h-px w-10 bg-ink/15" />
          <span className="text-xl">🍁</span>
          <span className="h-px w-10 bg-ink/15" />
        </div>
        <h1 className="brush-title text-4xl text-ink">藏书阁</h1>
        <p className="mt-2 text-sm text-ink-soft">那些被你夹上书签、想再读一遍的文字</p>
      </motion.div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-ink-light">
          <p>藏书阁还空着，去给喜欢的文字夹一枚书签吧 🍃</p>
          <Link to="/" className="ghibli-btn-ghost mt-4 inline-flex">去翻翻最新随笔</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
