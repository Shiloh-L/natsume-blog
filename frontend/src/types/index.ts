export interface Result<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export interface Tag {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
  description?: string
  cover?: string
  sort?: number
}

export interface Post {
  id: number
  title: string
  summary?: string
  content?: string
  cover?: string
  categoryId?: number
  categoryName?: string
  authorId?: number
  authorName?: string
  status?: number
  isTop?: number
  viewCount: number
  likeCount: number
  commentCount: number
  tags?: Tag[]
  createTime?: string
  updateTime?: string
}

export interface Comment {
  id: number
  postId: number
  parentId: number
  userId: number
  userName: string
  userAvatar?: string
  content: string
  createTime: string
  replies: Comment[]
}

export interface LoginUser {
  token: string
  userId: number
  username: string
  nickname: string
  avatar?: string
  role: string
}

export interface UserProfile {
  userId: number
  username: string
  nickname: string
  email?: string
  avatar?: string
  bio?: string
  role: string
}

export interface SearchHit {
  id: number
  title: string
  summary?: string
  cover?: string
  categoryName?: string
  authorName?: string
  tags?: string[]
  viewCount: number
  createTime?: string
  score?: number
  snippet?: string
}
