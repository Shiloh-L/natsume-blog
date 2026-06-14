import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPost,
  createTag,
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
  suggestMeta,
  suggestTags,
  suggestTitles,
  summarize,
  writeArticleStreamUrl,
} from '../api/ai'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import MarkdownView from '../components/MarkdownView'
import Select from '../components/Select'
import { readingStats } from '../utils/toc'

type Mode = 'edit' | 'split' | 'preview'

export default function WritePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id') ? Number(params.get('id')) : null

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: fetchTags })
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [cover, setCover] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [tagIds, setTagIds] = useState<number[]>([])
  const [origStatus, setOrigStatus] = useState(1)
  const [mode, setMode] = useState<Mode>('split')
  const [busy, setBusy] = useState(false)

  // AI
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('治愈温柔')
  const [generating, setGenerating] = useState(false)
  const [titleIdeas, setTitleIdeas] = useState<string[]>([])
  const [aiOpen, setAiOpen] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const bodyImgInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const stats = readingStats(content)

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
          setOrigStatus(p.status ?? 1)
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

  const addNewTag = async () => {
    const name = newTag.trim().replace(/^#/, '').trim()
    if (!name) return
    // 已存在则直接选中，不重复创建
    const existing = tags?.find((t) => t.name === name)
    if (existing) {
      setTagIds((arr) => Array.from(new Set([...arr, existing.id])))
      setNewTag('')
      return
    }
    setCreatingTag(true)
    try {
      const id = await createTag(name)
      await qc.invalidateQueries({ queryKey: ['tags'] })
      setTagIds((arr) => Array.from(new Set([...arr, id])))
      setNewTag('')
      toast.success(`已新建标签「${name}」`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '创建标签失败')
    } finally {
      setCreatingTag(false)
    }
  }

  /* ---------------- Markdown 工具栏 ---------------- */

  const restoreSelection = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const ta = contentRef.current
      if (!ta) return
      ta.focus()
      ta.selectionStart = start
      ta.selectionEnd = end
    })
  }

  const wrap = (before: string, after = before, placeholder = '文字') => {
    const ta = contentRef.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const sel = content.slice(s, e) || placeholder
    const next = content.slice(0, s) + before + sel + after + content.slice(e)
    setContent(next)
    restoreSelection(s + before.length, s + before.length + sel.length)
  }

  const linePrefix = (prefix: string) => {
    const ta = contentRef.current
    if (!ta) return
    const s = ta.selectionStart
    const lineStart = content.lastIndexOf('\n', s - 1) + 1
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart)
    setContent(next)
    restoreSelection(s + prefix.length, ta.selectionEnd + prefix.length)
  }

  const insertAtCursor = (text: string) => {
    const ta = contentRef.current
    if (!ta) {
      setContent(content + text)
      return
    }
    const s = ta.selectionStart
    const e = ta.selectionEnd
    setContent(content.slice(0, s) + text + content.slice(e))
    restoreSelection(s + text.length, s + text.length)
  }

  const onBodyImage = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    setBusy(true)
    try {
      const url = await uploadImage(file)
      insertAtCursor(`\n![](${url})\n`)
      toast.success('图片已插入正文')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '图片上传失败')
    } finally {
      setBusy(false)
    }
  }

  const TOOLS: { label: string; title: string; run: () => void }[] = [
    { label: 'H1', title: '一级标题', run: () => linePrefix('# ') },
    { label: 'H2', title: '二级标题', run: () => linePrefix('## ') },
    { label: 'H3', title: '三级标题', run: () => linePrefix('### ') },
    { label: '𝐁', title: '加粗', run: () => wrap('**') },
    { label: '𝑰', title: '斜体', run: () => wrap('*') },
    { label: 'S̶', title: '删除线', run: () => wrap('~~') },
    { label: '❝', title: '引用', run: () => linePrefix('> ') },
    { label: '•', title: '无序列表', run: () => linePrefix('- ') },
    { label: '1.', title: '有序列表', run: () => linePrefix('1. ') },
    { label: '🔗', title: '链接', run: () => wrap('[', '](https://)', '链接文字') },
    { label: '‹›', title: '行内代码', run: () => wrap('`') },
    { label: '{ }', title: '代码块', run: () => insertAtCursor('\n```\n\n```\n') },
    { label: '—', title: '分割线', run: () => insertAtCursor('\n\n---\n\n') },
    { label: '🖼', title: '插入图片', run: () => bodyImgInputRef.current?.click() },
  ]

  /* ---------------- AI ---------------- */

  const aiGenerate = async () => {
    const t = (topic || title).trim()
    if (!t) {
      toast.info('先给猫咪老师一个主题吧')
      return
    }
    setGenerating(true)
    setContent('')
    setMode('split')
    abortRef.current = new AbortController()
    let body = ''
    try {
      await streamSSE(
        writeArticleStreamUrl(t, style, categories?.find((c) => c.id === categoryId)?.name),
        (chunk) => {
          body += chunk
          setContent((prev) => prev + chunk)
        },
        abortRef.current.signal,
      )
    } catch {
      toast.error('AI 生成失败，请确认大模型可用')
      setGenerating(false)
      return
    }
    setGenerating(false)

    // 一键成文：正文写完后自动补齐标题/摘要/分类/标签
    if (!body.trim()) return
    setBusy(true)
    toast.info('正文已生成，正在补全标题与标签…')
    try {
      const meta = await suggestMeta(body, (categories || []).map((c) => c.name))
      if (meta.title) setTitle(meta.title)
      if (meta.summary) setSummary(meta.summary)
      if (meta.category && categories) {
        const matched = categories.find(
          (c) => c.name === meta.category || meta.category!.includes(c.name) || c.name.includes(meta.category!),
        )
        if (matched) setCategoryId(matched.id)
      }
      if (meta.tags?.length && tags) {
        const matched = tags.filter((tg) =>
          meta.tags!.some((n) => n.includes(tg.name) || tg.name.includes(n)),
        )
        if (matched.length) {
          setTagIds((arr) => Array.from(new Set([...arr, ...matched.map((tg) => tg.id)])))
        }
      }
      toast.success('一键成文完成，已为你设置好标题/分类/标签/摘要 🐱')
    } catch {
      toast.info('正文已生成，但自动补全元信息失败，可手动设置')
    } finally {
      setBusy(false)
    }
  }

  const aiContinue = async () => {
    if (!content.trim()) return
    setGenerating(true)
    setMode('split')
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
      toast.success('摘要已生成')
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

  /* ---------------- 封面 ---------------- */

  const onCoverUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`图片太大（${(file.size / 1024 / 1024).toFixed(1)}MB），请控制在 50MB 以内`)
      return
    }
    setBusy(true)
    try {
      setCover(await uploadImage(file))
      toast.success('封面已上传')
    } catch (err: any) {
      toast.error(`封面上传失败：${err?.response?.data?.message || err?.message || '请重试'}`)
    } finally {
      setBusy(false)
    }
  }

  /* ---------------- 提交 ---------------- */

  const submit = async (status: number) => {
    if (!title.trim()) {
      toast.error('给文章起个标题吧')
      return
    }
    if (!content.trim()) {
      toast.error('正文不能为空')
      return
    }
    setBusy(true)
    try {
      const form = { title, summary, content, cover: cover || '', categoryId, tagIds, status }
      if (editId) {
        await updatePost(editId, form)
        toast.success(status === 0 ? '已存为草稿' : '已更新')
        navigate(`/post/${editId}`)
      } else {
        const id = await createPost(form)
        toast.success(status === 0 ? '草稿已保存' : '发布成功')
        navigate(status === 0 ? '/me' : `/post/${id}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败')
    } finally {
      setBusy(false)
    }
  }

  const editorVisible = mode !== 'preview'
  const previewVisible = mode !== 'edit'

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 pb-28 xl:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 主编辑区 */}
        <div className="min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="写下一个动人的标题…"
            className="w-full bg-transparent text-3xl font-bold text-ink outline-none placeholder:text-ink-light/50"
          />
          <div className="mt-2 mb-4 h-px bg-gradient-to-r from-matcha/40 to-transparent" />

          {/* 工具栏 + 模式切换 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-0.5 rounded-xl bg-white/60 p-1 ring-1 ring-ink/5">
              {TOOLS.map((t) => (
                <button
                  key={t.title}
                  title={t.title}
                  onClick={t.run}
                  disabled={!editorVisible}
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm text-ink-soft transition-colors hover:bg-matcha-light/40 hover:text-matcha-deep disabled:opacity-40"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-white/60 p-1 text-xs ring-1 ring-ink/5">
              {(['edit', 'split', 'preview'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    mode === m ? 'bg-matcha text-white' : 'text-ink-soft hover:text-matcha-deep'
                  }`}
                >
                  {m === 'edit' ? '编辑' : m === 'split' ? '分屏' : '预览'}
                </button>
              ))}
            </div>
          </div>

          {/* 编辑器 / 预览 */}
          <div
            className={`mt-3 ${
              mode === 'split' ? 'grid gap-3 lg:grid-cols-2' : ''
            }`}
          >
            {editorVisible && (
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里写下你的故事，支持 Markdown…"
                className="min-h-[28rem] w-full resize-y rounded-2xl bg-white/80 p-4 font-mono text-sm leading-relaxed text-ink outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                    e.preventDefault()
                    wrap('**')
                  }
                }}
              />
            )}
            {previewVisible && (
              <div className="min-h-[28rem] overflow-auto rounded-2xl bg-paper-warm/60 p-5 ring-1 ring-ink/5">
                {content.trim() ? (
                  <MarkdownView content={content} />
                ) : (
                  <p className="text-sm text-ink-light">预览会显示在这里 🍃</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-ink-light">
            <span>✍ {stats.words} 字</span>
            <span>☕ 约 {stats.minutes} 分钟</span>
            {generating && <span className="animate-pulse text-matcha-deep">AI 书写中…</span>}
          </div>

          <input
            ref={bodyImgInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              onBodyImage(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {/* 侧栏 */}
        <aside className="space-y-5">
          {/* AI 创作助手 */}
          <div className="paper-card overflow-hidden">
            <button
              onClick={() => setAiOpen((o) => !o)}
              className="flex w-full items-center gap-2 px-4 py-3"
            >
              <img src="/cat.svg" className="h-6 w-6" alt="" />
              <span className="font-bold text-matcha-deep">猫咪老师 · 创作助手</span>
              <span className="ml-auto text-ink-light">{aiOpen ? '▾' : '▸'}</span>
            </button>
            {aiOpen && (
              <div className="space-y-3 px-4 pb-4">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="主题，如「夏夜的萤火虫」"
                  className="w-full rounded-xl bg-white/80 px-3 py-2 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
                />
                <div className="flex gap-2">
                  <Select
                    value={style}
                    onChange={setStyle}
                    className="flex-1"
                    options={[
                      { value: '治愈温柔', label: '治愈温柔' },
                      { value: '诗意散文', label: '诗意散文' },
                      { value: '技术干货', label: '技术干货' },
                      { value: '幽默轻松', label: '幽默轻松' },
                    ]}
                  />
                  {generating ? (
                    <button onClick={stopGenerate} className="ghibli-btn-ghost whitespace-nowrap text-sm">
                      ⏹ 停止
                    </button>
                  ) : (
                    <button onClick={aiGenerate} className="ghibli-btn-primary whitespace-nowrap text-sm">
                      ✨ 一键成文
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-snug text-ink-light">
                  「一键成文」会写好正文，并自动设置标题、分类、标签与摘要 ✨
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button onClick={aiContinue} disabled={generating} className="rounded-lg bg-white/70 px-2 py-1.5 text-ink-soft ring-1 ring-ink/10 hover:bg-white disabled:opacity-50">➕ 续写</button>
                  <button onClick={aiPolish} disabled={busy || generating} className="rounded-lg bg-white/70 px-2 py-1.5 text-ink-soft ring-1 ring-ink/10 hover:bg-white disabled:opacity-50">💧 润色</button>
                  <button onClick={aiSummary} disabled={busy} className="rounded-lg bg-white/70 px-2 py-1.5 text-ink-soft ring-1 ring-ink/10 hover:bg-white disabled:opacity-50">📝 摘要</button>
                  <button onClick={aiTitles} disabled={busy} className="rounded-lg bg-white/70 px-2 py-1.5 text-ink-soft ring-1 ring-ink/10 hover:bg-white disabled:opacity-50">🏷️ 起标题</button>
                  <button onClick={aiTags} disabled={busy} className="col-span-2 rounded-lg bg-white/70 px-2 py-1.5 text-ink-soft ring-1 ring-ink/10 hover:bg-white disabled:opacity-50"># 推荐标签</button>
                </div>
                {titleIdeas.length > 0 && (
                  <div className="space-y-1">
                    {titleIdeas.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTitle(t)
                          setTitleIdeas([])
                        }}
                        className="block w-full truncate rounded-lg bg-matcha-light/20 px-3 py-1.5 text-left text-xs text-ink-soft hover:bg-matcha-light/40"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 文章设置 */}
          <div className="paper-card space-y-4 p-4">
            <h3 className="font-serif font-bold text-ink">文章设置</h3>

            <div>
              <label className="mb-1 block text-xs text-ink-light">分类</label>
              <Select
                value={categoryId != null ? String(categoryId) : ''}
                onChange={(v) => setCategoryId(v ? Number(v) : undefined)}
                placeholder="选择分类"
                options={[
                  { value: '', label: '未分类' },
                  ...(categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []),
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink-light">封面</label>
              <div
                onDrop={(e) => {
                  e.preventDefault()
                  onCoverUpload(e.dataTransfer.files?.[0])
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => coverInputRef.current?.click()}
                className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-matcha/40 bg-white/60 text-sm text-ink-light hover:bg-white"
              >
                {cover ? (
                  <>
                    <img src={cover} alt="封面预览" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      点击更换
                    </div>
                  </>
                ) : (
                  <span className="px-3 text-center">🖼️ 点击或拖拽上传封面<br />（留空则用主题水彩图）</span>
                )}
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

            <div>
              <label className="mb-1 block text-xs text-ink-light">标签</label>
              <div className="flex flex-wrap gap-1.5">
                {tags?.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      tagIds.includes(t.id)
                        ? 'bg-matcha text-white'
                        : 'bg-white/70 text-ink-soft ring-1 ring-ink/10 hover:bg-white'
                    }`}
                  >
                    # {t.name}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewTag()
                    }
                  }}
                  maxLength={20}
                  placeholder="输入新标签，回车添加"
                  className="flex-1 rounded-full bg-white/80 px-3 py-1.5 text-xs outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
                />
                <button
                  onClick={addNewTag}
                  disabled={creatingTag || !newTag.trim()}
                  className="shrink-0 rounded-full bg-matcha-light/40 px-3 py-1.5 text-xs text-matcha-deep ring-1 ring-matcha/20 hover:bg-matcha-light/60 disabled:opacity-50"
                >
                  {creatingTag ? '添加中…' : '+ 新建'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink-light">摘要</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="可手写，或点上方「摘要」让 AI 代劳"
                className="w-full rounded-xl bg-white/80 p-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* 底部常驻操作栏 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/5 bg-paper-warm/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 xl:px-8">
          <span className="text-sm font-medium text-ink">
            {editId ? '编辑文章' : '写下你的故事'}
          </span>
          <span className="hidden text-xs text-ink-light sm:inline">✍ {stats.words} 字 · 约 {stats.minutes} 分钟</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="ghibli-btn-ghost text-sm">取消</button>
            <button onClick={() => submit(0)} disabled={busy} className="ghibli-btn-ghost text-sm disabled:opacity-50">
              存草稿
            </button>
            <button onClick={() => submit(1)} disabled={busy} className="ghibli-btn-primary text-sm disabled:opacity-50">
              {busy ? '寄往世界…' : editId && origStatus === 1 ? '保存修改' : '发布文章'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
