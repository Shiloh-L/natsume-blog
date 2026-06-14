import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { chatWithNyanko } from '../api/ai'

interface Msg {
  role: 'user' | 'cat'
  text: string
}

export default function NyankoChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'cat', text: '哼，本大爷是猫咪老师。有什么想问的，尽管说吧～ (｡•ω•｡)' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const reply = await chatWithNyanko(text)
      setMsgs((m) => [...m, { role: 'cat', text: reply }])
    } catch {
      setMsgs((m) => [...m, { role: 'cat', text: '本大爷现在有点累，等会儿再聊…' }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight), 50)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-paper-warm shadow-soft ring-2 ring-matcha-light"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 3 } }}
        aria-label="召唤猫咪老师"
      >
        <img src="/cat.svg" alt="猫咪老师" className="h-12 w-12" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-28 right-6 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[1.75rem] bg-paper-warm shadow-soft ring-1 ring-ink/10"
          >
            <div className="flex items-center gap-2 bg-matcha/90 px-4 py-3 text-white">
              <img src="/cat.svg" alt="" className="h-8 w-8 rounded-full bg-white/30 p-0.5" />
              <div>
                <div className="font-bold">猫咪老师</div>
                <div className="text-[10px] opacity-80">AI · 由 Spring AI 驱动</div>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-matcha text-white rounded-br-sm'
                        : 'bg-white text-ink rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm text-ink-light shadow-sm">
                    猫咪老师正在思考… 🐾
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-ink/5 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="和猫咪老师聊聊…"
                className="flex-1 rounded-full bg-white px-4 py-2 text-sm outline-none ring-1 ring-ink/5 focus:ring-matcha-light"
              />
              <button
                onClick={send}
                disabled={loading}
                className="ghibli-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
