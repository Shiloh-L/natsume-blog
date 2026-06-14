import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('迷路了')
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 原创水彩小灯笼妖怪：在雾里提灯找路 */}
        <svg viewBox="0 0 160 160" className="mx-auto h-40 w-40" aria-hidden="true">
          <ellipse cx="80" cy="140" rx="46" ry="8" fill="#5E7C5A" opacity="0.15" />
          <path d="M80 36c-18 0-30 14-30 34 0 22 16 40 30 52 14-12 30-30 30-52 0-20-12-34-30-34z"
                fill="#F4D58D" opacity="0.85" />
          <path d="M80 36c-18 0-30 14-30 34 0 22 16 40 30 52 14-12 30-30 30-52 0-20-12-34-30-34z"
                fill="none" stroke="#C9A24B" strokeWidth="2" opacity="0.5" />
          <circle cx="70" cy="74" r="4.5" fill="#3a3a3a" />
          <circle cx="90" cy="74" r="4.5" fill="#3a3a3a" />
          <path d="M72 90c4 4 12 4 16 0" fill="none" stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="62" cy="86" r="4" fill="#E89F71" opacity="0.55" />
          <circle cx="98" cy="86" r="4" fill="#E89F71" opacity="0.55" />
          <g opacity="0.7">
            <circle cx="34" cy="58" r="2.5" fill="#A9C48A" />
            <circle cx="126" cy="66" r="2" fill="#A9C48A" />
            <circle cx="44" cy="104" r="2" fill="#A9C48A" />
          </g>
        </svg>
        <h1 className="brush-title mt-4 text-5xl text-ink">迷路了…</h1>
        <p className="mt-3 text-ink-soft">
          这条小路通向了雾的深处，这里什么也没有呢～
        </p>
        <p className="mt-1 text-sm text-ink-light">
          也许那页名字早已被归还，或者你记错了路标。
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/" className="ghibli-btn-primary text-sm">提灯回家</Link>
          <Link to="/archive" className="ghibli-btn-ghost text-sm">翻翻长卷</Link>
        </div>
      </motion.div>
    </div>
  )
}
