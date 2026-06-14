import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { uploadImage } from '../api/posts'
import { createMoment } from '../api/moments'
import { toast } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'

export default function MomentComposer({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) {
    return (
      <div className="paper-card mb-8 p-5 text-center text-sm text-ink-soft">
        请先 <a href="/login" className="text-matcha-deep underline">登录</a>，再写下你的这一页 🍃
      </div>
    )
  }

  const onPickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remain = 9 - images.length
    const picked = Array.from(files).slice(0, remain)
    setUploading(true)
    try {
      for (const f of picked) {
        if (!f.type.startsWith('image/')) continue
        if (f.size > 50 * 1024 * 1024) {
          toast.error(`${f.name} 超过 50MB`)
          continue
        }
        const url = await uploadImage(f)
        setImages((arr) => [...arr, url])
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '图片上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (i: number) => setImages((arr) => arr.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.info('说点什么或配几张图吧～')
      return
    }
    setBusy(true)
    try {
      await createMoment({ content: content.trim(), images, location: location.trim() || undefined })
      toast.success('已发布')
      setContent('')
      setImages([])
      setLocation('')
      onPosted()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '发布失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="paper-card mb-10 p-5"
    >
      <div className="flex gap-3">
        <img
          src={user.avatar || '/cat.svg'}
          alt=""
          className="h-10 w-10 rounded-full border-2 border-matcha-light object-cover"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="今天，想记下点什么呢…"
            className="w-full resize-none rounded-2xl bg-white/70 p-3 font-serif text-sm leading-relaxed outline-none ring-1 ring-ink/5 focus:ring-matcha-light"
          />

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {images.map((src, i) => (
                <div key={i} className="group relative aspect-square">
                  <img src={src} alt={`待发布的第 ${i + 1} 张图片`} className="h-full w-full rounded-lg object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-nyanko-red text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-matcha/40 bg-white/40 text-2xl text-ink-light hover:bg-white/70"
                >
                  +
                </button>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {images.length === 0 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 rounded-full bg-matcha-light/40 px-3 py-1.5 text-xs text-matcha-deep hover:bg-matcha-light/60 disabled:opacity-50"
              >
                🖼️ {uploading ? '上传中…' : '配图'}
              </button>
            )}
            <div className="flex items-center gap-1 rounded-full bg-white/60 px-3 py-1.5 text-xs text-ink-light ring-1 ring-ink/5">
              📍
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="所在位置"
                className="w-20 bg-transparent outline-none placeholder:text-ink-light/60"
              />
            </div>
            <span className="ml-auto text-xs text-ink-light">{images.length}/9</span>
            <button
              onClick={submit}
              disabled={busy || uploading}
              className="ghibli-btn-primary px-5 py-1.5 text-sm disabled:opacity-50"
            >
              {busy ? '收藏中…' : '记下这一页'}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPickImages(e.target.files)}
          />
        </div>
      </div>
    </motion.div>
  )
}
