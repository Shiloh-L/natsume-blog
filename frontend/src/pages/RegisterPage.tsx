import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { register } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', nickname: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      setUser(user)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="paper-card w-full max-w-md p-8"
      >
        <div className="mb-6 text-center">
          <img src="/cat.svg" alt="" className="mx-auto h-16 w-16 animate-float" />
          <h1 className="brush-title mt-3 text-3xl text-ink">来这里安家</h1>
          <p className="mt-1 text-sm text-ink-light">成为温柔小屋的新朋友</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={form.username}
            onChange={upd('username')}
            placeholder="用户名（3-20 位）"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          <input
            type="password"
            value={form.password}
            onChange={upd('password')}
            placeholder="密码（6-32 位）"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          <input
            value={form.nickname}
            onChange={upd('nickname')}
            placeholder="昵称（选填）"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          <input
            value={form.email}
            onChange={upd('email')}
            placeholder="邮箱（选填）"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          {error && <p className="text-sm text-nyanko-red">{error}</p>}
          <button type="submit" disabled={loading} className="ghibli-btn-primary w-full disabled:opacity-50">
            {loading ? '安家中…' : '注册'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-light">
          已经是朋友了？
          <Link to="/login" className="ml-1 text-matcha-deep underline">
            直接登录
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
