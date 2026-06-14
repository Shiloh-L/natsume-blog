import { useState } from 'react'
import { motion } from 'motion/react'
import { toggleFollow } from '../api/follows'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

export default function FollowButton({
  userId,
  initialFollowed,
  size = 'md',
  onChange,
}: {
  userId: number
  initialFollowed: boolean
  size?: 'sm' | 'md'
  onChange?: (followed: boolean) => void
}) {
  const { user } = useAuthStore()
  const [followed, setFollowed] = useState(initialFollowed)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  // 不给自己显示结缘按钮
  if (!user || user.userId === userId) return null

  const onClick = async () => {
    setBusy(true)
    try {
      const { followed: now } = await toggleFollow(userId)
      setFollowed(now)
      onChange?.(now)
      toast.success(now ? '已写进友人帐 🦋' : '缘分暂别了')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'

  const label = followed ? (hover ? '解此缘' : '已结缘') : '+ 结缘'

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={busy}
      className={`rounded-full font-medium transition-all disabled:opacity-50 ${pad} ${
        followed
          ? hover
            ? 'bg-nyanko-red/12 text-nyanko-red ring-1 ring-nyanko-red/30'
            : 'bg-white/70 text-ink-soft ring-1 ring-ink/10 hover:bg-white'
          : 'bg-matcha text-white shadow-soft hover:bg-matcha-deep'
      }`}
    >
      {label}
    </motion.button>
  )
}
