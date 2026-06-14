import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

// 轻微旋转角度，营造手工拼贴感
const TILTS = [-2.5, 1.8, -1.2, 2.2, -2, 1.4, -1.6, 2.6, -2.2]
const TAPES = ['#bfd3a8', '#a9d2e0', '#d98e5a', '#c0d6b0']

export default function PhotoCollage({ images }: { images?: string[] }) {
  const [preview, setPreview] = useState<string | null>(null)
  if (!images || images.length === 0) return null

  const single = images.length === 1

  return (
    <>
      <div className={`mt-4 flex flex-wrap gap-4 ${single ? '' : 'pl-1'}`}>
        {images.map((src, i) => (
          <motion.button
            key={i}
            onClick={() => setPreview(src)}
            initial={{ opacity: 0, y: 12, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}
            whileHover={{ rotate: 0, scale: 1.03, zIndex: 10 }}
            className="group relative bg-white p-2 pb-5 shadow-paper"
            style={{ borderRadius: '4px' }}
          >
            {/* 和纸胶带 */}
            <span
              className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2 opacity-70"
              style={{ background: TAPES[i % TAPES.length] }}
            />
            <img
              src={src}
              alt=""
              loading="lazy"
              className={`block object-cover ${single ? 'h-60 w-60 sm:h-72 sm:w-80' : 'h-32 w-32 sm:h-36 sm:w-36'}`}
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
          >
            <motion.img
              initial={{ scale: 0.85, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.85 }}
              src={preview}
              alt=""
              className="max-h-[88vh] max-w-[90vw] rounded-sm border-8 border-white shadow-soft"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
