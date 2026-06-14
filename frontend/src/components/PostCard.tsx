import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { coverOf } from '../utils/cover'
import type { Post } from '../types'

export default function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6 }}
      className="paper-card group overflow-hidden"
    >
      <Link to={`/post/${post.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={coverOf(post.cover, post.id)}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          {post.isTop ? (
            <span className="absolute left-3 top-3 rounded-full bg-nyanko px-3 py-1 text-xs font-medium text-white shadow">
              置顶
            </span>
          ) : null}
          {post.categoryName ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-matcha-deep">
              {post.categoryName}
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <h3 className="font-serif text-lg font-bold text-ink line-clamp-1 group-hover:text-matcha-deep transition-colors">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-ink-soft line-clamp-2 leading-relaxed">
            {post.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 3).map((t) => (
              <span key={t.id} className="tag-chip">
                # {t.name}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-ink-light">
            <span className="flex items-center gap-1">
              <img
                src="/cat.svg"
                className="h-5 w-5 rounded-full bg-white/60 p-0.5"
                alt=""
              />
              {post.authorName}
            </span>
            <span className="flex gap-3">
              <span>👁 {post.viewCount}</span>
              <span>♡ {post.likeCount}</span>
              <span>💬 {post.commentCount}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
