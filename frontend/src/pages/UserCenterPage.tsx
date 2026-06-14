import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { deletePost, fetchMyPosts, uploadImage } from '../api/posts'
import { fetchMe, updateProfile } from '../api/auth'
import { fetchFollowStats } from '../api/follows'
import { coverOf } from '../utils/cover'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import type { Post, UserProfile } from '../types'
import Loading from '../components/Loading'

export default function UserCenterPage() {
  const { user, patchUser } = useAuthStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  // 编辑资料
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', bio: '', avatar: '', email: '' })
  const [saving, setSaving] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<{ followers: number; following: number } | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([fetchMe(), fetchMyPosts()])
      .then(([p, list]) => {
        setProfile(p)
        setPosts(list.records)
        if (p?.userId) {
          fetchFollowStats(p.userId)
            .then((s) => setStats({ followers: s.followers, following: s.following }))
            .catch(() => {})
        }
      })
      .catch(() => toast.error('加载失败，请重新登录'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDelete = async (id: number) => {
    if (!confirm('确定删除这篇文章吗？')) return
    try {
      await deletePost(id)
      toast.success('已删除')
      setPosts((arr) => arr.filter((p) => p.id !== id))
    } catch {
      toast.error('删除失败')
    }
  }

  const openEdit = () => {
    setForm({
      nickname: profile?.nickname || '',
      bio: profile?.bio || '',
      avatar: profile?.avatar || '',
      email: profile?.email || '',
    })
    setEditing(true)
  }

  const onAvatarUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('请选择一张图片呢～')
    if (file.size > 50 * 1024 * 1024) return toast.error('图片不能超过 50MB')
    setSaving(true)
    try {
      const url = await uploadImage(file)
      setForm((f) => ({ ...f, avatar: url }))
      toast.success('头像已上传')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '上传失败')
    } finally {
      setSaving(false)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  const saveProfile = async () => {
    if (!form.nickname.trim()) {
      toast.error('昵称不能为空')
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
      patchUser({ nickname: updated.nickname, avatar: updated.avatar })
      setEditing(false)
      toast.success('资料已更新')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null
  if (loading) return <Loading />

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="paper-card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left"
      >
        <img
          src={profile?.avatar || user.avatar || '/cat.svg'}
          alt=""
          className="h-20 w-20 shrink-0 rounded-full border-4 border-matcha-light object-cover"
        />
        <div className="flex-1">
          <h1 className="brush-title text-3xl text-ink">{profile?.nickname || user.nickname}</h1>
          <div className="mt-0.5 text-xs text-ink-light">@{profile?.username || user.username}</div>
          <p className="mt-1 text-sm text-ink-soft">{profile?.bio || '这个人很神秘，什么都没留下。'}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink-light sm:justify-start">
            <span className="tag-chip">{profile?.role === 'ROLE_ADMIN' ? '小屋主人' : '小屋友人'}</span>
            <span>📝 {posts.length} 篇文章</span>
            {stats && (
              <>
                <Link to="/follow-feed" className="hover:text-ink">
                  🍃 {stats.following} 友人
                </Link>
                <span>🌸 {stats.followers} 牵挂</span>
              </>
            )}
          </div>
        </div>
        <div className="flex w-full flex-row flex-wrap justify-center gap-2 sm:w-auto sm:flex-col">
          <button onClick={openEdit} className="ghibli-btn-ghost whitespace-nowrap text-sm">编辑资料</button>
          <Link to="/bookmarks" className="ghibli-btn-ghost whitespace-nowrap text-center text-sm">🍁 藏书阁</Link>
          <Link to="/write" className="ghibli-btn-primary whitespace-nowrap text-sm">写新文章</Link>
        </div>
      </motion.div>

      {editing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={() => !saving && setEditing(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="paper-card w-full max-w-md p-6"
          >
            <h2 className="brush-title mb-5 text-2xl text-ink">编辑资料</h2>

            <div className="mb-4 flex items-center gap-4">
              <img
                src={form.avatar || '/cat.svg'}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-matcha-light object-cover"
              />
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={saving}
                className="ghibli-btn-ghost text-xs disabled:opacity-50"
              >
                {saving ? '上传中…' : '更换头像'}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onAvatarUpload(e.target.files?.[0])}
              />
            </div>

            <label className="mb-1 block text-xs text-ink-light">昵称</label>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="你的昵称"
              className="mb-3 w-full rounded-2xl bg-white/80 px-4 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
            />

            <label className="mb-1 block text-xs text-ink-light">个性签名</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={2}
              placeholder="写一句关于自己的话…"
              className="mb-3 w-full resize-none rounded-2xl bg-white/80 px-4 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
            />

            <label className="mb-1 block text-xs text-ink-light">邮箱</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="可选"
              className="mb-5 w-full rounded-2xl bg-white/80 px-4 py-2.5 text-sm outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(false)} disabled={saving} className="ghibli-btn-ghost">
                取消
              </button>
              <button onClick={saveProfile} disabled={saving} className="ghibli-btn-primary disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <h2 className="brush-title mb-4 mt-10 text-2xl text-ink">我的文章</h2>
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="paper-card flex flex-wrap items-center gap-3 p-4">
            <img
              src={coverOf(p.cover, p.id)}
              alt=""
              className="h-16 w-24 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link to={`/post/${p.id}`} className="font-serif font-bold text-ink hover:text-matcha-deep line-clamp-1">
                {p.title}
              </Link>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-light">
                <span>{p.status === 0 ? '📝 草稿' : '✅ 已发布'}</span>
                <span>👁 {p.viewCount}</span>
                <span>♡ {p.likeCount}</span>
                <span>💬 {p.commentCount}</span>
              </div>
            </div>
            <div className="ml-auto flex shrink-0 gap-1">
              <button
                onClick={() => navigate(`/write?id=${p.id}`)}
                className="rounded-full bg-white/60 px-4 py-1.5 text-xs text-ink-soft ring-1 ring-ink/10 hover:bg-white"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="rounded-full px-3 py-1.5 text-xs text-nyanko-red hover:bg-nyanko-red/10"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="py-12 text-center text-ink-light">还没有写过文章，去写下第一篇吧 ✍️</p>
        )}
      </div>
    </div>
  )
}
