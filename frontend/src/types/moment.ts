export interface MomentComment {
  id: number
  momentId: number
  rootId: number
  userId: number
  userName: string
  userAvatar?: string
  replyToId: number
  replyToName?: string
  content: string
  createTime: string
}

export interface Moment {
  id: number
  userId: number
  userName: string
  userAvatar?: string
  content?: string
  images?: string[]
  location?: string
  likeCount: number
  commentCount: number
  createTime: string
  liked: boolean
  likeUsers: string[]
  comments: MomentComment[]
}
