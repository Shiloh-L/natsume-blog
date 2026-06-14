import { http, unwrap } from './client'
import type { LoginUser, Result, UserProfile } from '../types'

export const login = (username: string, password: string) =>
  unwrap<LoginUser>(http.post<Result<LoginUser>>('/api/auth/login', { username, password }))

export const register = (form: {
  username: string
  password: string
  nickname?: string
  email?: string
}) => unwrap<LoginUser>(http.post<Result<LoginUser>>('/api/auth/register', form))

export const fetchMe = () =>
  unwrap<UserProfile>(http.get<Result<UserProfile>>('/api/auth/me'))

export const updateProfile = (form: {
  nickname?: string
  avatar?: string
  bio?: string
  email?: string
}) => unwrap<UserProfile>(http.put<Result<UserProfile>>('/api/auth/me', form))

export const logout = () => http.post('/api/auth/logout')
