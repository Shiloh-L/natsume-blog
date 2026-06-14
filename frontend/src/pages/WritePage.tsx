import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  createPost,
  fetchCategories,
  fetchPost,
  fetchTags,
  updatePost,
  uploadImage,
} from '../api/posts'
import {
  continueStreamUrl,
  polish,
  streamSSE,
  suggestTags,
  suggestTitles,
  summarize,
  writeArticleStreamUrl,
} from '../api/ai'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import MarkdownView from '../components/MarkdownView'

export default function WritePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id') ? Number(params.get('id')) : null

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags })

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('# 我的故事\n\n在这里写下一段温柔的回忆…')
  const [cover, setCover] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [tagIds, setTagIds] = useState<number[]>([])
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)

  // AI 面板
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('治愈温柔')
  const [generating, setGenerating] = useState(false)
  const [titleIdeas, setTitleIdeas] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editId) {
      fetchPost(editId)
        .then((p) => {
          setTitle(p.title)
          setSummary(p.summary || '')
          setContent(p.content || '')
          setCover(p.cover || '')
          setCategoryId(p.categoryId)
          setTagIds((p.tags || []).map((t) => t.id))
        })
        .catch(() => toast.error('加载文章失败'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  if (!user) {
    return (
      <div className="py-24 text-center text-ink-soft">
        请先 <a href="/login" className="text-matcha-deep underline">登录</a> 后再来写文章哦～
      </div>
    )
  }

  const toggleTag = (id: number) =>
    setTagIds((arr) => (arr.includes(id) ? arr.filter((t) => t !== id) : [...arr, id]))

  /* ---------------- AI 操作 ---------------- */

  const aiGenerate = async () => {
    const t = (topic || title).trim()
    if (!t) {
      toast.info('先给猫咪老师一个主题吧')
      return
    }
    setGenerating(true)
    setContent('')
    setPreview(true)
    abortRef.current = new AbortController()
    try {
      await streamSSE(
        writeArticleStreamUrl(t, style, categories?.find((c) => c.id === categoryId)?.name),
        (chunk) => setContent((prev) => prev + chunk),
        abortRef.current.signal,
      )
      toast.success('生成完成，可继续编辑')
    } catch {
      toast.error('AI 生成失败，请确认大模型网关可用')
    } finally {
      setGenerating(false)
    }
  }

  const aiContinue = async () => {
    if (!content.trim()) return
    setGenerating(true)
    setPreview(true)
    abortRef.current = new AbortController()
    try {
      await streamSSE(
        continueStreamUrl(),
        (chunk) => setContent((prev) => prev + chunk),
        abortRef.current.signal,
        { text: content.slice(-1500) },
      )
    } catch {
      toast.error('续写失败')
    } finally {
      setGenerating(false)
    }
  }

  const stopGenerate = () => {
    abortRef.current?.abort()
    setGenerating(false)
  }

  const aiPolish = async () => {
    if (!content.trim()) return
    setBusy(true)
    try {
      setContent(await polish(content))
      toast.success('润色完成')
    } catch {
      toast.error('润色失败')
    } finally {
      setBusy(false)
    }
  }

  const aiSummary = async () => {
    if (!content.trim()) return
    setBusy(true)
    try {
      setSummary(await summarize(content))
    } catch {
      toast.error('生成摘要失败')
    } finally {
      setBusy(false)
    }
  }

  const aiTitles = async () => {
    setBusy(true)
    try {
      setTitleIdeas(await suggestTitles(content || topic || title))
    } catch {
      toast.error('生成标题失败')
    } finally {
      setBusy(false)
    }
  }

  const aiTags = async () => {
    if (!content.trim() || !tags) return
    setBusy(true)
    try {
      const names = await suggestTags(content)
      const matched = tags.filter((t) => names.some((n) => n.includes(t.name) || t.name.includes(n)))
      if (matched.length) {
        setTagIds((arr) => Array.from(new Set([...arr, ...matched.map((t) => t.id)])))
        toast.success(`已选中 ${matched.length} 个相关标签`)
      } else {
        toast.info(`AI 建议：${names.join('、')}`)
      }
    } catch {
      toast.error('推荐标签失败')
    } finally {
      setBusy(false)
    }
  }

  const onCoverUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    const maxMB = 50
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`图片太大（${(file.size / 1024 / 1024).toFixed(1)}MB），请控制在 ${maxMB}MB 以内`)
      return
    }
    setBusy(true)
    try {
      const url = await uploadImage(file)
      setCover(url)
      toast.success('封面已上传')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '上传失败，请重试'
      toast.error(`封面上传失败：${msg}`)
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('标题和正文不能为空')
      return
    }
    setBusy(true)
    try {
      const form = {
        title,
        summary,
        content,
        cover: cover || '',
        categoryId,
        tagIds,
        status: 1,
      }
      if (editId) {
        await updatePost(editId, form)
        toast.success('已更新')
        navigate(`/post/${editId}`)
      } else {
        const id = await createPost(form)
        toast.success('发布成功')
        navigate(`/post/${id}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="brush-title mb-6 text-4xl text-ink">{editId ? '✍️ 编辑文章' : '✍️ 写下你的故事'}</h1>

      {/* AI 创作面板 */}
      <div className="mb-8 rounded-[1.5rem] border border-matcha/20 bg-matcha-light/15 p-5">
        <div className="mb-3 flex items-center gap-2">
          <img src="/cat.svg" className="h-7 w-7" alt="" />
          <span className="font-bold text-matcha-deep">猫咪老师 · AI 创作助手</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="给个主题，如「夏夜的萤火虫」"
            className="min-w-[12rem] flex-1 rounded-full bg-white/80 px-4 py-2 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="rounded-full bg-white/80 px-3 py-2 text-sm outline-none ring-1 ring-ink/10"
          >
            <option>治愈温柔</option>
            <option>诗意散文</option>
            <option>技术干货</option>
            <option>幽默轻松</option>
          </select>
          {generating ? (
            <button onClick={stopGenerate} className="ghibli-btn-ghost text-sm">⏹ 停止</button>
          ) : (
            <button onClick={aiGenerate} className="ghibli-btn-primary text-sm">✨ AI 帮我写</button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button onClick={aiContinue} disabled={generating} className="ghibli-btn-ghost text-xs disabled:opacity-50">➕ 续写</button>
          <button onClick={aiPolish} disabled={busy || generating} className="ghibli-btn-ghost text-xs disabled:opacity-50">💧 润色</button>
          <button onClick={aiSummary} disabled={busy} className="ghibli-btn-ghost text-xs disabled:opacity-50">📝 摘要</button>
          <button onClick={aiTitles} disabled={busy} className="ghibli-btn-ghost text-xs disabled:opacity-50">🏷️ 起标题</button>
          <button onClick={aiTags} disabled={busy} className="ghibli-btn-ghost text-xs disabled:opacity-50"># 推荐标签</button>
        </div>
        {titleIdeas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {titleIdeas.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTitle(t)
                  setTitleIdeas([])
                }}
                className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink-soft ring-1 ring-ink/10 hover:bg-white"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 表单 */}
      <div className="space-y-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className="w-full rounded-2xl bg-white/80 px-4 py-3 text-lg outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-2xl bg-white/80 px-4 py-2.5 outline-none ring-1 ring-ink/10"
          >
            <option value="">选择分类</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div
            onDrop={(e) => {
              e.preventDefault()
              onCoverUpload(e.dataTransfer.files?.[0])
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => coverInputRef.current?.click()}
            className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-matcha/40 bg-white/60 px-4 py-2.5 text-sm text-ink-light hover:bg-white"
          >
            {cover ? (
              <img src={cover} alt="封面预览" className="h-9 w-14 rounded object-cover" />
            ) : (
              <span>🖼️</span>
            )}
            <span>{cover ? '点击或拖拽更换封面' : '点击或拖拽上传封面图'}</span>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                onCoverUpload(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags?.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tagIds.includes(t.id)
                  ? 'bg-matcha text-white'
                  : 'bg-white/70 text-ink-soft ring-1 ring-ink/10'
              }`}
            >
              # {t.name}
            </button>
          ))}
        </div>

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          placeholder="摘要（可手写，或点上方「摘要」让 AI 代劳）"
          className="w-full rounded-2xl bg-white/80 p-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
        />

        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-light">
            正文（Markdown）{generating && <span className="ml-2 animate-pulse text-matcha-deep">AI 书写中…</span>}
          </span>
          <button onClick={() => setPreview((p) => !p)} className="text-sm text-matcha-deep underline">
            {preview ? '继续编辑' : '预览'}
          </button>
        </div>

        {preview ? (
          <div className="paper-card min-h-[16rem] p-6">
            <MarkdownView content={content} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full rounded-2xl bg-white/80 p-4 font-mono text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
        )}

        <div className="flex justify-end gap-3">
          <button onClick={() => navigate(-1)} className="ghibli-btn-ghost">取消</button>
          <button onClick={onSubmit} disabled={busy} className="ghibli-btn-primary disabled:opacity-50">
            {busy ? '寄往世界…' : editId ? '保存修改' : '发布文章'}
          </button>
        </div>
      </div>
    </div>
  )
}
