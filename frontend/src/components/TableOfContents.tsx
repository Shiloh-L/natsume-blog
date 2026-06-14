import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Heading } from '../utils/toc'

const NAV_OFFSET = 88

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (headings.length < 2) return
    let raf = 0
    const compute = () => {
      raf = 0
      let current = headings[0].id
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= NAV_OFFSET + 16) {
          current = h.id
        } else {
          break
        }
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [headings])

  if (headings.length < 2) return null

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    // 依赖全局 scroll-behavior: smooth 平滑滚动，标题的 scroll-mt-24 处理导航栏偏移
    el.scrollIntoView({ block: 'start' })
    setActive(id)
  }

  return (
    <motion.nav
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="fixed top-32 right-[calc((100vw-48rem)/2-15.5rem)] hidden max-h-[62vh] w-56 overflow-auto rounded-3xl border border-ink/5 bg-paper-warm/70 p-4 shadow-soft backdrop-blur-md xl:block"
    >
      <div className="brush-title mb-2 flex items-center gap-2 text-lg text-matcha-deep">
        <span>📖</span> 目录
      </div>
      <ul className="space-y-0.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: (h.level - 1) * 12 }}>
            <button
              onClick={() => jump(h.id)}
              className={`block w-full truncate rounded-lg px-2 py-1 text-left transition-colors ${
                active === h.id
                  ? 'bg-matcha-light/40 font-medium text-matcha-deep'
                  : 'text-ink-light hover:bg-white/60 hover:text-ink-soft'
              }`}
              title={h.text}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </motion.nav>
  )
}
