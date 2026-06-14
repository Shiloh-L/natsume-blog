import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { coverOf } from '../utils/cover'
import type { Post } from '../types'

export default function PostListItem({ post, index = 0 }: { post: Post; index?: number }) {
  const reverse = index % 2 === 1
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 4) * 0.06 }}
      className="paper-card group overflow-hidden"
    >
      <Link
        to={`/post/${post.id}`}
        className={`flex flex-col sm:flex-row ${reverse ? 'sm:flex-row-reverse' : ''}`}
      >
        <div className="relative h-48 overflow-hidden sm:h-auto sm:w-2/5 sm:min-h-[13rem]">
          <img
            src={coverOf(post.cover, post.id)}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent sm:bg-gradient-to-r" />
          {post.isTop ? (
            <span className="absolute left-3 top-3 rounded-full bg-nyanko px-3 py-1 text-xs font-medium text-white shadow">
              置顶
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
          {post.categoryName ? (
            <span className="mb-2 inline-flex w-fit items-center rounded-full bg-matcha-light/40 px-3 py-1 text-xs font-medium text-matcha-deep">
              {post.categoryName}
            </span>
          ) : null}
          <h3 className="font-serif text-xl font-bold text-ink line-clamp-1 transition-colors group-hover:text-matcha-deep sm:text-2xl">
            {post.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
            {post.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 3).map((t) => (
              <span key={t.id} className="tag-chip">
                # {t.name}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-light">
            <span>🗓 {post.createTime?.slice(0, 10)}</span>
            <span>👁 {post.viewCount}</span>
            <span>♡ {post.likeCount}</span>
            <span>💬 {post.commentCount}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
