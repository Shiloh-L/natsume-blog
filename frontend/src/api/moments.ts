import { http, unwrap } from './client'
import type { PageResult, Result } from '../types'
import type { Moment, MomentComment } from '../types/moment'

export const fetchMoments = (current = 1, size = 10) =>
  unwrap<PageResult<Moment>>(
    http.get<Result<PageResult<Moment>>>('/api/moments', { params: { current, size } }),
  )

export const createMoment = (form: { content?: string; images?: string[]; location?: string }) =>
  unwrap<number>(http.post<Result<number>>('/api/moments', form))

export const deleteMoment = (id: number) =>
  unwrap<void>(http.delete<Result<void>>(`/api/moments/${id}`))

export const toggleMomentLike = (id: number) =>
  unwrap<{ liked: boolean }>(http.post<Result<{ liked: boolean }>>(`/api/moments/${id}/like`))

export const commentMoment = (form: {
  momentId: number
  replyCommentId?: number
  content: string
}) => unwrap<MomentComment>(http.post<Result<MomentComment>>('/api/moments/comments', form))

export const deleteMomentComment = (id: number) =>
  unwrap<void>(http.delete<Result<void>>(`/api/moments/comments/${id}`))
