import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toggleBookmark } from '../api/bookmarks'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

export default function BookmarkButton({
  postId,
  initialBookmarked,
  initialCount,
  onChange,
}: {
  postId: number
  initialBookmarked: boolean
  initialCount: number
  onChange?: (bookmarked: boolean) => void
}) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    if (!user) {
      toast.error('登录后才能把它收进藏书阁哦～')
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      const { bookmarked: now } = await toggleBookmark(postId)
      setBookmarked(now)
      setCount((c) => c + (now ? 1 : -1))
      onChange?.(now)
      toast.success(now ? '已夹上书签 🍁' : '取下了书签')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all disabled:opacity-50 ${
        bookmarked
          ? 'bg-nyanko/15 text-nyanko-deep ring-1 ring-nyanko/30'
          : 'bg-white/70 text-ink-soft ring-1 ring-ink/10 hover:bg-white'
      }`}
    >
      <span>{bookmarked ? '🍁' : '🔖'}</span>
      {bookmarked ? '已收藏' : '收藏'}
      <span className="text-sm opacity-70">({count})</span>
    </motion.button>
  )
}
