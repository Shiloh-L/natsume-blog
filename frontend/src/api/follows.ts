import { http, unwrap } from './client'
import type { PageResult, Post, Result } from '../types'

export interface FollowStats {
  followers: number
  following: number
  followed: boolean
}

export interface FollowUser {
  userId: number
  userName: string
  avatar?: string
  followed: boolean
}

export const toggleFollow = (userId: number) =>
  unwrap<{ followed: boolean }>(http.post<Result<{ followed: boolean }>>(`/api/follows/${userId}`))

export const fetchFollowStats = (userId: number) =>
  unwrap<FollowStats>(http.get<Result<FollowStats>>(`/api/follows/stats/${userId}`))

export const fetchFollowers = (userId: number) =>
  unwrap<FollowUser[]>(http.get<Result<FollowUser[]>>(`/api/follows/${userId}/followers`))

export const fetchFollowing = (userId: number) =>
  unwrap<FollowUser[]>(http.get<Result<FollowUser[]>>(`/api/follows/${userId}/following`))

export const fetchFollowFeed = (current = 1, size = 10) =>
  unwrap<PageResult<Post>>(
    http.get<Result<PageResult<Post>>>('/api/follows/feed', { params: { current, size } }),
  )
