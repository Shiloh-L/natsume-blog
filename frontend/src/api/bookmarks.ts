import { http, unwrap } from './client'
import type { PageResult, Post, Result } from '../types'

export interface BookmarkStatus {
  bookmarked: boolean
  count: number
}

export const toggleBookmark = (postId: number) =>
  unwrap<{ bookmarked: boolean }>(
    http.post<Result<{ bookmarked: boolean }>>(`/api/bookmarks/${postId}`),
  )

export const fetchBookmarkStatus = (postId: number) =>
  unwrap<BookmarkStatus>(http.get<Result<BookmarkStatus>>(`/api/bookmarks/status/${postId}`))

export const fetchMyBookmarks = (current = 1, size = 12) =>
  unwrap<PageResult<Post>>(
    http.get<Result<PageResult<Post>>>('/api/bookmarks/mine', { params: { current, size } }),
  )
