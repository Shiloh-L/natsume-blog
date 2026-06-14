import { http, unwrap } from './client'
import type { Result } from '../types'

export const chatWithNyanko = (message: string) =>
  unwrap<string>(http.post<Result<string>>('/api/ai/chat', { message }))

export const summarize = (content: string) =>
  unwrap<string>(http.post<Result<string>>('/api/ai/summary', { content }))

export const polish = (content: string) =>
  unwrap<string>(http.post<Result<string>>('/api/ai/polish', { content }))

export const suggestTitles = (text: string) =>
  unwrap<string[]>(http.post<Result<string[]>>('/api/ai/titles', { text }))

export const suggestTags = (content: string) =>
  unwrap<string[]>(http.post<Result<string[]>>('/api/ai/tags', { content }))

export interface Citation {
  postId: number
  title: string
  score: number
}
export interface AskResult {
  answer: string
  citations: Citation[]
}
export const askBlog = (question: string) =>
  unwrap<AskResult>(http.post<Result<AskResult>>('/api/ai/ask', { question }))

/**
 * 流式接口：通过 fetch + ReadableStream 读取 SSE。
 * onChunk 每收到一段文本回调一次。
 * 支持 GET（默认）或 POST + JSON body（用于正文较长、避免 URL 过长导致 414 的场景）。
 */
export async function streamSSE(
  url: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  body?: unknown,
): Promise<void> {
  const resp = await fetch(url, {
    method: body !== undefined ? 'POST' : 'GET',
    signal,
    headers: body !== undefined
      ? { Accept: 'text/event-stream', 'Content-Type': 'application/json' }
      : { Accept: 'text/event-stream' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok || !resp.body) throw new Error('流式请求失败')
  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      // 一个 SSE 事件可能包含多行 data:，按规范需用 \n 重新拼接以保留换行
      const dataLines: string[] = []
      for (const line of part.split('\n')) {
        const trimmed = line.replace(/\r$/, '')
        if (trimmed.startsWith('data:')) {
          dataLines.push(trimmed.slice(5))
        }
      }
      if (dataLines.length === 0) continue
      const data = dataLines.join('\n')
      if (data !== '[DONE]') onChunk(data)
    }
  }
}

export const writeArticleStreamUrl = (topic: string, style?: string, category?: string) => {
  const params = new URLSearchParams({ topic })
  if (style) params.set('style', style)
  if (category) params.set('category', category)
  return `/api/ai/write/stream?${params.toString()}`
}

export const continueStreamUrl = () => '/api/ai/continue/stream'
