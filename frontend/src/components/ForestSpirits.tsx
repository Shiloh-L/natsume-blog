import { motion } from 'motion/react'

/**
 * 草木精灵 — 原创森林小精灵，唤起宫崎骏式「森林与精灵」的氛围。
 * 刻意做成苔绿色、头顶发芽的种子精灵，与任何版权角色（如煤精灵）区分。
 */
function Seedling({ size = 28, color = '#5f6b58' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* 头顶嫩芽 */}
      <path d="M20 9 C20 4 16 2 13 3 C15 5 16 7 20 9 Z" fill="#8FAE7B" />
      <path d="M20 9 C20 5 23 3 26 4 C24 6 23 7 20 9 Z" fill="#A9C58D" />
      <path d="M20 6 L20 12" stroke="#5E7C5A" strokeWidth="1" strokeLinecap="round" />
      {/* 毛绒身体 */}
      <circle cx="20" cy="24" r="12" fill={color} />
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M9 18 L5 15" />
        <path d="M31 18 L35 15" />
        <path d="M9 30 L5 33" />
        <path d="M31 30 L35 33" />
        <path d="M20 36 L20 39" />
      </g>
      {/* 眼睛 */}
      <circle cx="16" cy="23" r="2.6" fill="#fff" />
      <circle cx="24" cy="23" r="2.6" fill="#fff" />
      <circle cx="16.3" cy="23.3" r="1.2" fill="#2c2a26" />
      <circle cx="23.7" cy="23.3" r="1.2" fill="#2c2a26" />
    </svg>
  )
}

function Acorn({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 14 C8 22 11 28 16 28 C21 28 24 22 24 14 Z" fill="#c8a06a" />
      <path d="M7 13 C7 9 11 7 16 7 C21 7 25 9 25 13 C25 15 7 15 7 13 Z" fill="#8a6a44" />
      <path d="M16 5 L16 8" stroke="#6b5230" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const SPRITES = [
  { type: 'seedling', left: '6%', top: '62%', size: 30, dur: 5, delay: 0 },
  { type: 'seedling', left: '88%', top: '54%', size: 24, dur: 6, delay: 0.8, color: '#6b6f54' },
  { type: 'acorn', left: '16%', top: '40%', size: 18, dur: 7, delay: 0.4 },
  { type: 'acorn', left: '80%', top: '70%', size: 22, dur: 6.5, delay: 1.2 },
  { type: 'seedling', left: '70%', top: '36%', size: 20, dur: 5.5, delay: 1.6, color: '#586b5c' },
] as const

export default function ForestSpirits() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPRITES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: s.left, top: s.top }}
          animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 8 : -8, 0] }}
          transition={{ repeat: Infinity, duration: s.dur, delay: s.delay, ease: 'easeInOut' }}
        >
          {s.type === 'seedling' ? (
            <Seedling size={s.size} color={'color' in s ? s.color : undefined} />
          ) : (
            <Acorn size={s.size} />
          )}
        </motion.div>
      ))}
    </div>
  )
}

export { Seedling, Acorn }
