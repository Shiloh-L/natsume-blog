import axios from 'axios'
import type { Result } from '../types'
import { toast } from '../store/toastStore'

const baseURL = import.meta.env.VITE_API_BASE ?? ''

export const http = axios.create({
  baseURL,
  timeout: 120000,
})

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('natsume-auth')
  if (raw) {
    try {
      const token = JSON.parse(raw)?.state?.user?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      /* ignore */
    }
  }
  return config
})

// 网络错误全局提示，节流避免刷屏
let lastNetToast = 0
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('natsume-auth')
    } else if (!error.response || error.code === 'ECONNABORTED') {
      const now = Date.now()
      if (now - lastNetToast > 3000) {
        lastNetToast = now
        toast.error('网络连接失败，请稍后重试')
      }
    }
    return Promise.reject(error)
  },
)

export async function unwrap<T>(promise: Promise<{ data: Result<T> }>): Promise<T> {
  const { data } = await promise
  if (data.code !== 200) {
    throw new Error(data.message || '请求失败')
  }
  return data.data
}
