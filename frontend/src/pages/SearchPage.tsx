import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { search } from '../api/search'
import Loading from '../components/Loading'
import type { SearchHit } from '../types'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [input, setInput] = useState(q)
  const [results, setResults] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setSearched(true)
    search(q, 1, 20)
      .then((res) => {
        setResults(res.records)
        setTotal(res.total)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [q])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) setParams({ q: input.trim() })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="brush-title mb-6 text-center text-4xl text-ink">在回忆里寻找</h1>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-ink-light">
        基于 <span className="text-matcha-deep">向量语义检索</span>，即使用词不同也能找到相关的回忆
      </p>
      <form onSubmit={onSubmit} className="mx-auto mb-10 flex max-w-xl gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入关键词，例如「名字」「架构」…"
          className="flex-1 rounded-full bg-white/80 px-5 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
        />
        <button type="submit" className="ghibli-btn-primary">搜索</button>
      </form>

      {loading ? (
        <Loading text="正在翻找妖怪们的踪迹…" />
      ) : (
        <>
          {searched && (
            <p className="mb-6 text-sm text-ink-light">
              共找到 <span className="text-matcha-deep">{total}</span> 段相关回忆
            </p>
          )}
          <div className="space-y-4">
            {results.map((r) => (
              <Link
                key={r.id}
                to={`/post/${r.id}`}
                className="paper-card block p-5 transition-transform hover:-translate-y-1"
              >
                <div className="flex gap-4">
                  {r.cover && (
                    <img
                      src={r.cover}
                      alt={r.title}
                      className="h-20 w-28 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-ink">{r.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft line-clamp-2">
                      {r.snippet || r.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-ink-light">
                      {r.categoryName && <span className="tag-chip">{r.categoryName}</span>}
                      <span>👁 {r.viewCount}</span>
                      {typeof r.score === 'number' && (
                        <span className="text-matcha-deep">相关度 {(r.score * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {searched && !loading && results.length === 0 && (
              <p className="py-16 text-center text-ink-light">没有找到相关的回忆呢 🍂</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
