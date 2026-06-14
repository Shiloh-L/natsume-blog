import { http, unwrap } from './client'
import type { Comment, Result } from '../types'

export const fetchComments = (postId: number) =>
  unwrap<Comment[]>(http.get<Result<Comment[]>>('/api/comments', { params: { postId } }))

export const postComment = (form: { postId: number; parentId?: number; content: string }) =>
  unwrap<number>(http.post<Result<number>>('/api/comments', form))

export const deleteComment = (id: number) =>
  unwrap<void>(http.delete<Result<void>>(`/api/comments/${id}`))
