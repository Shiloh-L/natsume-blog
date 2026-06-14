import { http, unwrap } from './client'
import type { PageResult, Result } from '../types'

export interface Notification {
  id: number
  actorId: number
  actorName: string
  actorAvatar?: string
  type: 'POST_COMMENT' | 'POST_REPLY' | 'MOMENT_COMMENT' | 'MOMENT_REPLY' | 'MOMENT_LIKE' | 'FOLLOW'
  targetType: 'POST' | 'MOMENT' | 'USER'
  targetId: number
  targetTitle: string
  excerpt?: string
  read: boolean
  createTime: string
}

export const fetchNotifications = (current = 1, size = 20) =>
  unwrap<PageResult<Notification>>(
    http.get<Result<PageResult<Notification>>>('/api/notifications', { params: { current, size } }),
  )

export const fetchUnreadCount = () =>
  unwrap<{ count: number }>(http.get<Result<{ count: number }>>('/api/notifications/unread-count'))

export const markNotificationRead = (id: number) =>
  unwrap<void>(http.put<Result<void>>(`/api/notifications/${id}/read`))

export const markAllNotificationsRead = () =>
  unwrap<void>(http.put<Result<void>>('/api/notifications/read-all'))

export const clearNotifications = () =>
  unwrap<void>(http.delete<Result<void>>('/api/notifications'))
