import { motion } from 'motion/react'

export default function Loading({ text = '猫咪老师正在赶来…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-ink-light">
      <motion.div
        className="text-4xl"
        animate={{ y: [0, -10, 0], rotate: [0, -6, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      >
        🐾
      </motion.div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
