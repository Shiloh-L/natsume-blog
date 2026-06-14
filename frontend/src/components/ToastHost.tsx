import { AnimatePresence, motion } from 'motion/react'
import { useToastStore } from '../store/toastStore'

const styles: Record<string, string> = {
  success: 'bg-matcha text-white',
  error: 'bg-nyanko-red text-white',
  info: 'bg-sky-deep text-white',
}
const icons: Record<string, string> = { success: '🌿', error: '🍂', info: '🏮' }

export default function ToastHost() {
  const { toasts } = useToastStore()
  return (
    <div className="fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm shadow-soft ${styles[t.kind]}`}
          >
            <span>{icons[t.kind]}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
