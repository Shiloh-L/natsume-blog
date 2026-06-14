import { http, unwrap } from './client'
import type { Category, PageResult, Post, Result, Tag } from '../types'

export interface PostQuery {
  current?: number
  size?: number
  categoryId?: number
  tagId?: number
  keyword?: string
}

export const fetchPosts = (params: PostQuery) =>
  unwrap<PageResult<Post>>(http.get<Result<PageResult<Post>>>('/api/posts', { params }))

export const fetchPost = (id: number) =>
  unwrap<Post>(http.get<Result<Post>>(`/api/posts/${id}`))

export const likePost = (id: number) =>
  unwrap<void>(http.post<Result<void>>(`/api/posts/${id}/like`))

export interface PostForm {
  title: string
  summary?: string
  content: string
  cover?: string
  categoryId?: number
  status?: number
  isTop?: number
  tagIds?: number[]
}

export const createPost = (form: PostForm) =>
  unwrap<number>(http.post<Result<number>>('/api/posts', form))

export const updatePost = (id: number, form: PostForm) =>
  unwrap<void>(http.put<Result<void>>(`/api/posts/${id}`, form))

export const deletePost = (id: number) =>
  unwrap<void>(http.delete<Result<void>>(`/api/posts/${id}`))

export const fetchMyPosts = (current = 1, size = 30) =>
  unwrap<PageResult<Post>>(
    http.get<Result<PageResult<Post>>>('/api/posts/mine', { params: { current, size } }),
  )

export const uploadImage = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  // 不手动设置 Content-Type，让 axios 自动带上 multipart 边界(boundary)
  return unwrap<string>(http.post<Result<string>>('/api/files/upload', fd))
}

export const fetchCategories = () =>
  unwrap<Category[]>(http.get<Result<Category[]>>('/api/categories'))

export const createCategory = (name: string, description?: string) =>
  unwrap<number>(http.post<Result<number>>('/api/categories', { name, description }))

export const fetchTags = () =>
  unwrap<Tag[]>(http.get<Result<Tag[]>>('/api/tags'))

export const createTag = (name: string) =>
  unwrap<number>(http.post<Result<number>>('/api/tags', { name }))

export interface ArchiveItem {
  id: number
  title: string
  categoryName?: string
  createTime: string
}

export const fetchArchive = () =>
  unwrap<ArchiveItem[]>(http.get<Result<ArchiveItem[]>>('/api/posts/archive'))
