import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAuthStore } from '../store/authStore'
import { logout as apiLogout } from '../api/auth'
import NotificationBell from './NotificationBell'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/follow-feed', label: '牵绊' },
  { to: '/moments', label: '光阴' },
  { to: '/ask', label: '问猫咪老师' },
  { to: '/about', label: '关于' },
]

export default function Navbar() {
  const { user, clear } = useAuthStore()
  const [keyword, setKeyword] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 路由切换时收起抽屉
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // 抽屉打开时禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(keyword.trim())}`)
      setMenuOpen(false)
    }
  }

  const onLogout = async () => {
    try {
      await apiLogout()
    } catch {
      /* ignore */
    }
    clear()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md">
      <div className="border-b border-ink/5 bg-paper-warm/70">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src="/cat.svg"
              alt="猫咪老师"
              className="h-9 w-9 drop-shadow md:h-10 md:w-10"
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.6 }}
            />
            <div className="leading-tight">
              <div className="brush-title text-lg text-ink md:text-xl">夏目友人帐</div>
              <div className="text-[10px] tracking-[0.3em] text-ink-light">温柔小屋</div>
            </div>
          </Link>

          {/* 桌面导航 */}
          <div className="ml-2 hidden items-center gap-5 md:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="ink-link">
                {n.label}
              </Link>
            ))}
          </div>

          {/* 桌面搜索 */}
          <form onSubmit={onSearch} className="ml-auto hidden md:block">
            <div className="flex items-center rounded-full bg-white/70 px-4 py-1.5 shadow-inner ring-1 ring-ink/5">
              <span className="text-ink-light">🔍</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="寻找一段回忆…"
                className="w-32 bg-transparent px-2 text-sm outline-none transition-all placeholder:text-ink-light/70 focus:w-44"
              />
            </div>
          </form>

          {/* 右侧操作区 */}
          <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
            {user ? (
              <>
                <Link to="/write" className="ghibli-btn-ghost hidden text-sm md:inline-flex">
                  ✍️ 写文章
                </Link>
                <NotificationBell />
                {/* 桌面头像下拉 */}
                <div className="group relative hidden md:block">
                  <img
                    src={user.avatar || '/cat.svg'}
                    alt={user.nickname}
                    className="h-9 w-9 rounded-full border-2 border-matcha-light object-cover"
                  />
                  <div className="invisible absolute right-0 mt-2 w-32 rounded-2xl bg-white p-2 text-sm opacity-0 shadow-soft transition-all group-hover:visible group-hover:opacity-100">
                    <div className="px-3 py-1 text-ink-soft">{user.nickname}</div>
                    <Link to="/me" className="block rounded-xl px-3 py-1.5 text-ink-soft hover:bg-paper-deep">
                      个人中心
                    </Link>
                    <Link to="/bookmarks" className="block rounded-xl px-3 py-1.5 text-ink-soft hover:bg-paper-deep">
                      藏书阁
                    </Link>
                    <button
                      onClick={onLogout}
                      className="w-full rounded-xl px-3 py-1.5 text-left text-nyanko-deep hover:bg-paper-deep"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="ghibli-btn-primary hidden text-sm md:inline-flex">
                登录
              </Link>
            )}

            {/* 移动端汉堡按钮 */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-ink-soft ring-1 ring-ink/5 md:hidden"
              aria-label="打开菜单"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
      </header>

      {/* 移动端抽屉 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[80vw] flex-col bg-paper-warm shadow-soft md:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
                <span className="brush-title text-lg text-ink">温柔小屋</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-ink-soft"
                  aria-label="关闭菜单"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4">
                {/* 用户信息 */}
                {user && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/60 p-3">
                    <img
                      src={user.avatar || '/cat.svg'}
                      alt={user.nickname}
                      className="h-11 w-11 rounded-full border-2 border-matcha-light object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-serif font-semibold text-ink">{user.nickname}</div>
                      <div className="truncate text-xs text-ink-light">@{user.username}</div>
                    </div>
                  </div>
                )}

                {/* 搜索 */}
                <form onSubmit={onSearch} className="mb-4">
                  <div className="flex items-center rounded-full bg-white/70 px-4 py-2 ring-1 ring-ink/5">
                    <span className="text-ink-light">🔍</span>
                    <input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="寻找一段回忆…"
                      className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-ink-light/70"
                    />
                  </div>
                </form>

                {/* 导航 */}
                <nav className="space-y-1">
                  {NAV.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className="block rounded-xl px-4 py-2.5 text-ink-soft transition-colors hover:bg-matcha-light/30 hover:text-matcha-deep"
                    >
                      {n.label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link to="/write" className="block rounded-xl px-4 py-2.5 text-ink-soft hover:bg-matcha-light/30 hover:text-matcha-deep">
                        ✍️ 写文章
                      </Link>
                      <Link to="/me" className="block rounded-xl px-4 py-2.5 text-ink-soft hover:bg-matcha-light/30 hover:text-matcha-deep">
                        个人中心
                      </Link>
                      <Link to="/bookmarks" className="block rounded-xl px-4 py-2.5 text-ink-soft hover:bg-matcha-light/30 hover:text-matcha-deep">
                        🍁 藏书阁
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              {/* 底部操作 */}
              <div className="border-t border-ink/5 px-5 py-4">
                {user ? (
                  <button onClick={onLogout} className="ghibli-btn-ghost w-full text-sm text-nyanko-deep">
                    退出登录
                  </button>
                ) : (
                  <Link to="/login" className="ghibli-btn-primary w-full text-sm">
                    登录 / 安家
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
