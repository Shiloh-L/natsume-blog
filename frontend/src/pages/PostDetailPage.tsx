import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { fetchPost, likePost } from '../api/posts'
import { fetchComments, postComment } from '../api/comments'
import { summarize } from '../api/ai'
import { fetchFollowStats } from '../api/follows'
import { fetchBookmarkStatus } from '../api/bookmarks'
import MarkdownView from '../components/MarkdownView'
import TableOfContents from '../components/TableOfContents'
import ReadingProgress from '../components/ReadingProgress'
import FollowButton from '../components/FollowButton'
import BookmarkButton from '../components/BookmarkButton'
import Loading from '../components/Loading'
import { extractHeadings, readingStats } from '../utils/toc'
import { coverOf } from '../utils/cover'
import { useAuthStore } from '../store/authStore'
import type { Comment } from '../types'

function CommentItem({ c }: { c: Comment }) {
  return (
    <div className="flex gap-3">
      <img
        src={c.userAvatar || '/cat.svg'}
        alt={c.userName}
        className="h-9 w-9 rounded-full border border-matcha-light/60"
      />
      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-white/70 px-4 py-2 shadow-sm">
          <div className="text-sm font-semibold text-matcha-deep">{c.userName}</div>
          <p className="mt-1 text-sm text-ink/90">{c.content}</p>
        </div>
        <div className="mt-1 pl-2 text-xs text-ink-light">
          {c.createTime?.replace('T', ' ').slice(0, 16)}
        </div>
        {c.replies?.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-matcha-light/40 pl-4">
            {c.replies.map((r) => (
              <CommentItem key={r.id} c={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  })
  const mutation = useMutation({
    mutationFn: () => postComment({ postId, content: text }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  return (
    <section className="mt-12">
      <h3 className="brush-title mb-5 text-2xl text-ink">
        💬 留言 ({comments?.length || 0})
      </h3>
      {user ? (
        <div className="mb-8 flex gap-3">
          <img src={user.avatar || '/cat.svg'} className="h-9 w-9 rounded-full" alt="" />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="留下一句温柔的话…"
              className="w-full rounded-2xl bg-white/70 p-3 text-sm outline-none ring-1 ring-ink/5 focus:ring-matcha-light"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => text.trim() && mutation.mutate()}
                disabled={mutation.isPending}
                className="ghibli-btn-primary text-sm disabled:opacity-50"
              >
                {mutation.isPending ? '寄出中…' : '寄出留言'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl bg-paper-deep/40 p-4 text-center text-sm text-ink-soft">
          请先 <Link to="/login" className="text-matcha-deep underline">登录</Link> 后再留言哦～
        </div>
      )}

      <div className="space-y-6">
        {comments?.map((c) => (
          <CommentItem key={c.id} c={c} />
        ))}
        {comments?.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-light">还没有留言，来做第一个吧 🐾</p>
        )}
      </div>
    </section>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const qc = useQueryClient()
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
  })

  const { data: followStats } = useQuery({
    queryKey: ['follow-stats', post?.authorId],
    queryFn: () => fetchFollowStats(post!.authorId!),
    enabled: !!post?.authorId,
  })

  const { data: bookmarkStatus } = useQuery({
    queryKey: ['bookmark-status', postId],
    queryFn: () => fetchBookmarkStatus(postId),
    enabled: !!postId,
  })

  const likeMutation = useMutation({
    mutationFn: () => likePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', postId] }),
  })

  const onSummarize = async () => {
    if (!post?.content) return
    setSummarizing(true)
    try {
      setSummary(await summarize(post.content))
    } catch {
      setSummary('猫咪老师太懒了，暂时没法总结…')
    } finally {
      setSummarizing(false)
    }
  }

  const headings = useMemo(() => extractHeadings(post?.content || ''), [post?.content])
  const stats = useMemo(() => readingStats(post?.content || ''), [post?.content])

  if (isLoading || !post) return <Loading />

  return (
    <>
      <ReadingProgress />
      <TableOfContents headings={headings} />
      <article className="mx-auto max-w-3xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[2rem] shadow-soft"
      >
        <div className="relative h-64 md:h-80">
          <img src={coverOf(post.cover, post.id)} alt={post.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            {post.categoryName && (
              <Link
                to={`/category/${post.categoryId}`}
                className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-matcha-deep"
              >
                {post.categoryName}
              </Link>
            )}
            <h1 className="brush-title mt-3 text-4xl leading-snug">{post.title}</h1>
          </div>
        </div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-ink-light">
        <span className="flex items-center gap-2">
          <img
            src="/cat.svg"
            className="h-6 w-6 rounded-full bg-white/60 p-0.5"
            alt=""
          />
          {post.authorName}
        </span>
        {post.authorId && followStats && (
          <FollowButton userId={post.authorId} initialFollowed={followStats.followed} size="sm" />
        )}
        <span>🗓 {post.createTime?.replace('T', ' ').slice(0, 16)}</span>
        <span>👁 {post.viewCount}</span>
        <span>✍ {stats.words} 字</span>
        <span>☕ 约 {stats.minutes} 分钟</span>
        <button
          onClick={() => onSummarize()}
          disabled={summarizing}
          className="ml-auto rounded-full bg-sky-light/60 px-3 py-1 text-xs text-sky-deep hover:bg-sky-light"
        >
          {summarizing ? 'AI 总结中…' : '✨ AI 一句话总结'}
        </button>
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 rounded-2xl border border-sky/30 bg-sky-light/20 p-4 text-sm text-ink-soft"
        >
          <span className="font-semibold text-sky-deep">猫咪老师说：</span> {summary}
        </motion.div>
      )}

      <div className="mt-8">
        <MarkdownView content={post.content || ''} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {post.tags?.map((t) => (
          <span key={t.id} className="tag-chip">
            # {t.name}
          </span>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => likeMutation.mutate()}
          className="ghibli-btn-primary"
        >
          ♡ 喜欢这篇 ({post.likeCount})
        </motion.button>
        {bookmarkStatus && (
          <BookmarkButton
            postId={postId}
            initialBookmarked={bookmarkStatus.bookmarked}
            initialCount={bookmarkStatus.count}
          />
        )}
      </div>

      <CommentSection postId={postId} />
    </article>
    </>
  )
}
