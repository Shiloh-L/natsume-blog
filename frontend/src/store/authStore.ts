import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginUser } from '../types'

interface AuthState {
  user: LoginUser | null
  setUser: (user: LoginUser) => void
  patchUser: (patch: Partial<LoginUser>) => void
  clear: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      patchUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      clear: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'ROLE_ADMIN',
    }),
    { name: 'natsume-auth' },
  ),
)
