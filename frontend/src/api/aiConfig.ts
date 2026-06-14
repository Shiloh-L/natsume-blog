import { http, unwrap } from './client'
import type { Result } from '../types'

export interface AiConfigView {
  provider: string
  baseUrl: string
  model: string
  temperature: number
  apiKeySet: boolean
  apiKeyMasked: string
  updateTime?: string
}

export interface AiConfigUpdate {
  provider: string
  baseUrl: string
  model: string
  temperature: number
  apiKey?: string
}

export interface AiTestResult {
  ok: boolean
  reply?: string
  error?: string
  costMs: number
}

export const fetchAiConfig = () =>
  unwrap<AiConfigView>(http.get<Result<AiConfigView>>('/api/ai/config'))

export const updateAiConfig = (body: AiConfigUpdate) =>
  unwrap<AiConfigView>(http.put<Result<AiConfigView>>('/api/ai/config', body))

export const testAiConfig = () =>
  unwrap<AiTestResult>(http.post<Result<AiTestResult>>('/api/ai/config/test'))
