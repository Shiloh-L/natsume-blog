import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '../api/notifications'
import { useNotifStore } from '../store/notifStore'
import { useAuthStore } from '../store/authStore'
import { timeAgo } from '../utils/time'

const TYPE_TEXT: Record<Notification['type'], string> = {
  POST_COMMENT: '评论了你的文章',
  POST_REPLY: '回复了你',
  MOMENT_COMMENT: '评论了你的光阴',
  MOMENT_REPLY: '回复了你',
  MOMENT_LIKE: '为你的光阴留下了心意',
  FOLLOW: '把你写进了友人帐',
}
const TYPE_ICON: Record<Notification['type'], string> = {
  POST_COMMENT: '💬',
  POST_REPLY: '🪶',
  MOMENT_COMMENT: '💬',
  MOMENT_REPLY: '🪶',
  MOMENT_LIKE: '🌿',
  FOLLOW: '🦋',
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const { unread, refresh, setUnread } = useNotifStore()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  // 登录后轮询未读数
  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    refresh()
    const t = setInterval(refresh, 20000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // 点击外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      try {
        const res = await fetchNotifications(1, 15)
        setItems(res.records)
      } finally {
        setLoading(false)
      }
    }
  }

  const onItemClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id)
        setItems((arr) => arr.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
        refresh()
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
    navigate(
      n.targetType === 'POST'
        ? `/post/${n.targetId}`
        : n.targetType === 'USER'
          ? '/follow-feed'
          : '/moments',
    )
  }

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      setItems((arr) => arr.map((i) => ({ ...i, read: true })))
      setUnread(0)
    } catch {
      /* ignore */
    }
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-lg ring-1 ring-ink/5 transition-colors hover:bg-white"
        aria-label="通知"
      >
        🔔
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-nyanko-red px-1 text-[10px] font-bold text-white"
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute right-0 mt-2 max-h-[26rem] w-80 overflow-hidden rounded-2xl bg-paper-warm shadow-soft ring-1 ring-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/5 px-4 py-2.5">
              <span className="font-serif font-semibold text-ink">消息通知</span>
              {unread > 0 && (
                <button onClick={onMarkAll} className="text-xs text-matcha-deep hover:text-matcha">
                  全部已读
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {loading ? (
                <div className="py-10 text-center text-sm text-ink-light">加载中…</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-sm text-ink-light">还没有消息 🍃</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-white/60 ${
                      n.read ? '' : 'bg-matcha-light/15'
                    }`}
                  >
                    <img
                      src={n.actorAvatar || '/cat.svg'}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border border-matcha-light/50 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-snug text-ink/90">
                        <span className="font-medium text-matcha-deep">{n.actorName}</span>
                        <span className="text-ink-light"> {TYPE_ICON[n.type]} {TYPE_TEXT[n.type]}</span>
                      </div>
                      {n.targetType !== 'USER' && (
                        <div className="mt-0.5 truncate text-xs text-ink-light">
                          《{n.targetTitle}》{n.excerpt ? ` — ${n.excerpt}` : ''}
                        </div>
                      )}
                      <div className="mt-0.5 text-[11px] text-ink-light/70">{timeAgo(n.createTime)}</div>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-nyanko-red" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
