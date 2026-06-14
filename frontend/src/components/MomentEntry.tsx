import { useState } from 'react'
import { motion } from 'motion/react'
import type { Moment, MomentComment } from '../types/moment'
import { commentMoment, deleteMoment, deleteMomentComment, toggleMomentLike } from '../api/moments'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { timeAgo } from '../utils/time'
import PhotoCollage from './PhotoCollage'

function splitDate(iso?: string): { day: string; month: string } {
  if (!iso) return { day: '', month: '' }
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return { day: '', month: '' }
  return { day: String(d.getDate()).padStart(2, '0'), month: `${d.getMonth() + 1}月` }
}

export default function MomentEntry({
  moment,
  index = 0,
  onChange,
}: {
  moment: Moment
  index?: number
  onChange: () => void
}) {
  const { user } = useAuthStore()
  const [liked, setLiked] = useState(moment.liked)
  const [likeUsers, setLikeUsers] = useState<string[]>(moment.likeUsers || [])
  const [comments, setComments] = useState<MomentComment[]>(moment.comments || [])
  const [replyTo, setReplyTo] = useState<MomentComment | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const isOwner = user && (user.userId === moment.userId || user.role === 'ROLE_ADMIN')
  const { day, month } = splitDate(moment.createTime)

  const onLike = async () => {
    if (!user) return toast.info('留下心意前，先轻轻登录吧')
    try {
      const { liked: now } = await toggleMomentLike(moment.id)
      setLiked(now)
      setLikeUsers((arr) => (now ? [...arr, user.nickname] : arr.filter((n) => n !== user.nickname)))
    } catch {
      toast.error('操作失败')
    }
  }

  const onDelete = async () => {
    if (!confirm('要把这页轻轻撕下吗？')) return
    try {
      await deleteMoment(moment.id)
      toast.success('已收起')
      onChange()
    } catch {
      toast.error('删除失败')
    }
  }

  const openComment = (c?: MomentComment) => {
    if (!user) return toast.info('登录后才能回应哦')
    setReplyTo(c || null)
    setShowInput(true)
  }

  const submitComment = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      const c = await commentMoment({
        momentId: moment.id,
        replyCommentId: replyTo?.id,
        content: text.trim(),
      })
      setComments((arr) => [...arr, c])
      setText('')
      setShowInput(false)
      setReplyTo(null)
    } catch {
      toast.error('回应失败')
    } finally {
      setBusy(false)
    }
  }

  const removeComment = async (id: number) => {
    try {
      await deleteMomentComment(id)
      setComments((arr) => arr.filter((c) => c.id !== id && c.rootId !== id))
    } catch {
      toast.error('删除失败')
    }
  }

  // 两级分组：主楼 + 楼中楼
  const topLevel = comments.filter((c) => !c.rootId || c.rootId === 0)
  const repliesOf = (rootId: number) =>
    comments
      .filter((c) => c.rootId === rootId)
      .sort((a, b) => a.id - b.id)

  const canManage = (c: MomentComment) =>
    user && (user.userId === c.userId || user.role === 'ROLE_ADMIN')

  const renderComment = (c: MomentComment, isReply: boolean) => (
    <div key={c.id} className="group/c text-sm leading-relaxed">
      <span className="font-serif font-medium text-matcha-deep">{c.userName}</span>
      {isReply && c.replyToId > 0 && c.replyToName && (
        <span className="text-ink-light"> 轻声回应 {c.replyToName}</span>
      )}
      <span className="text-ink-light"> ——</span>
      <span className="ml-1 font-serif text-ink/85">{c.content}</span>
      <span className="ml-2 inline-flex gap-2 align-middle text-xs">
        <button
          onClick={() => openComment(c)}
          className="text-matcha-deep/70 hover:text-matcha-deep"
        >
          回复
        </button>
        {canManage(c) && (
          <button
            onClick={() => removeComment(c.id)}
            className="text-ink-light/60 hover:text-nyanko-red"
          >
            删除
          </button>
        )}
      </span>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.06 }}
      className="relative pl-14 sm:pl-20"
    >
      {/* 时间线节点：手写日期 */}
      <div className="absolute left-0 top-1 w-12 text-center sm:w-16">
        <div className="brush-title text-2xl leading-none text-matcha-deep sm:text-3xl">{day}</div>
        <div className="mt-0.5 text-[10px] tracking-widest text-ink-light">{month}</div>
      </div>
      {/* 时间线上的萤火点 */}
      <span className="absolute left-[3.05rem] top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-matcha shadow-[0_0_0_4px_rgba(143,174,123,0.2)] sm:left-[4.55rem]" />

      {/* 信笺卡片 */}
      <div className="paper-card relative ml-2 p-5">
        <div className="flex items-center gap-3">
          <img
            src={moment.userAvatar || '/cat.svg'}
            alt={moment.userName}
            className="h-10 w-10 rounded-full border border-matcha-light/50 object-cover"
          />
          <div className="flex-1">
            <div className="font-serif font-semibold text-ink">{moment.userName}</div>
            <div className="flex items-center gap-2 text-xs text-ink-light">
              {moment.location && <span>📍 {moment.location}</span>}
              <span>{timeAgo(moment.createTime)}</span>
            </div>
          </div>
          {isOwner && (
            <button onClick={onDelete} className="text-xs text-ink-light hover:text-nyanko-red">
              撕下
            </button>
          )}
        </div>

        {moment.content && (
          <p className="mt-3 whitespace-pre-wrap font-serif text-[15px] leading-loose text-ink/90">
            {moment.content}
          </p>
        )}

        <PhotoCollage images={moment.images} />

        {/* 心意 / 回应 操作 */}
        <div className="mt-4 flex items-center gap-2 border-t border-dashed border-ink/10 pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
              liked
                ? 'bg-nyanko/15 text-nyanko-deep'
                : 'bg-white/50 text-ink-light hover:bg-matcha-light/30 hover:text-matcha-deep'
            }`}
          >
            <motion.span whileTap={{ scale: 1.5 }}>🌿</motion.span>
            心意 {likeUsers.length > 0 && <span>· {likeUsers.length}</span>}
          </button>
          <button
            onClick={() => openComment()}
            className="flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1 text-xs text-ink-light transition-colors hover:bg-sky-light/40 hover:text-sky-deep"
          >
            🪶 回应 {comments.length > 0 && <span>· {comments.length}</span>}
          </button>
        </div>

        {/* 心意名单：一行轻描淡写 */}
        {likeUsers.length > 0 && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-matcha-deep/80">
            <span>🌿</span>
            <span className="italic">{likeUsers.join(' · ')} 都留下了心意</span>
          </div>
        )}

        {/* 回应：两级嵌套。主楼 + 楼中楼（缩进），均带可见的「回复」按钮 */}
        {topLevel.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-matcha-light/50 pl-4">
            {topLevel.map((c) => {
              const subs = repliesOf(c.id)
              return (
                <div key={c.id}>
                  {renderComment(c, false)}
                  {subs.length > 0 && (
                    <div className="mt-1.5 space-y-1.5 border-l border-dashed border-matcha-light/40 pl-3">
                      {subs.map((r) => renderComment(r, true))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {showInput && (
          <div className="mt-3">
            {replyTo && (
              <div className="mb-1.5 flex items-center gap-2 text-xs text-ink-light">
                <span>回复 <span className="text-matcha-deep">{replyTo.userName}</span></span>
                <button onClick={() => setReplyTo(null)} className="hover:text-nyanko-red">
                  取消
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder={replyTo ? `轻声回应 ${replyTo.userName}…` : '写下一句温柔的回应…'}
                className="flex-1 rounded-full bg-white/80 px-4 py-1.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
              />
              <button
                onClick={submitComment}
                disabled={busy}
                className="ghibli-btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
              >
                寄出
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
