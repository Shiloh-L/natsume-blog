import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      setUser(user)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || '登录失败，请检查用户名或密码')
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
          <img src="/cat.svg" alt="" className="mx-auto h-16 w-16" />
          <h1 className="brush-title mt-3 text-3xl text-ink">欢迎回家</h1>
          <p className="mt-1 text-sm text-ink-light">登录后即可留言、写下你的故事</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full rounded-2xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-matcha-light"
          />
          {error && <p className="text-sm text-nyanko-red">{error}</p>}
          <button type="submit" disabled={loading} className="ghibli-btn-primary w-full disabled:opacity-50">
            {loading ? '推开门中…' : '登录'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-light">
          还没有账号？
          <Link to="/register" className="ml-1 text-matcha-deep underline">
            来这里安家
          </Link>
        </p>
        <p className="mt-3 rounded-xl bg-paper-deep/40 p-2 text-center text-xs text-ink-light">
          体验账号：admin / admin123
        </p>
      </motion.div>
    </div>
  )
}
