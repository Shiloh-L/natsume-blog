import { create } from 'zustand'
import { fetchUnreadCount } from '../api/notifications'

interface NotifState {
  unread: number
  setUnread: (n: number) => void
  refresh: () => Promise<void>
}

export const useNotifStore = create<NotifState>((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: n }),
  refresh: async () => {
    try {
      const { count } = await fetchUnreadCount()
      set({ unread: count })
    } catch {
      /* ignore (not logged in etc.) */
    }
  },
}))
