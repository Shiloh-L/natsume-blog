import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { askBlog, type AskResult } from '../api/ai'
import MarkdownView from '../components/MarkdownView'
import { toast } from '../store/toastStore'
import { usePageTitle } from '../hooks/usePageTitle'

const SUGGESTIONS = ['博客里讲了哪些妖怪的故事？', '这个博客的技术架构是怎样的？', '有没有关于夏天和离别的文章？']

export default function AskPage() {
  usePageTitle('问猫咪老师')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AskResult | null>(null)

  const ask = async (q: string) => {
    const query = q.trim()
    if (!query) return
    setQuestion(query)
    setLoading(true)
    setResult(null)
    try {
      setResult(await askBlog(query))
    } catch {
      toast.error('猫咪老师有点累，稍后再问吧')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-3 h-20 w-20"
        >
          <img src="/cat.svg" alt="" className="h-full w-full animate-float" />
        </motion.div>
        <h1 className="brush-title text-4xl text-ink">问问猫咪老师</h1>
        <p className="mt-2 text-ink-soft">
          基于博客全部文章的 <span className="text-matcha-deep">RAG 智能问答</span>，答案有据可查
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(question)
        }}
        className="mt-8 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="问点什么吧，比如：博客里有哪些治愈的故事？"
          className="flex-1 rounded-full bg-white/80 px-5 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
        />
        <button type="submit" disabled={loading} className="ghibli-btn-primary disabled:opacity-50">
          {loading ? '思考中…' : '提问'}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full bg-white/60 px-3 py-1 text-xs text-ink-soft ring-1 ring-ink/10 hover:bg-white"
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-ink-light">
          <span className="animate-bounce">🐾</span> 猫咪老师正在翻阅博客…
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 paper-card p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <img src="/cat.svg" className="h-8 w-8" alt="" />
            <span className="font-bold text-matcha-deep">猫咪老师的回答</span>
          </div>
          <MarkdownView content={result.answer} />
          {result.citations?.length > 0 && (
            <div className="mt-5 border-t border-ink/5 pt-4">
              <div className="mb-2 text-xs font-semibold text-ink-light">参考文章</div>
              <div className="flex flex-wrap gap-2">
                {result.citations.map((c) => (
                  <Link
                    key={c.postId}
                    to={`/post/${c.postId}`}
                    className="tag-chip hover:bg-matcha-light/60"
                    title={`相关度 ${(c.score * 100).toFixed(0)}%`}
                  >
                    📖 {c.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
