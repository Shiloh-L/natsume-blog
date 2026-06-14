import { http, unwrap } from './client'
import type { PageResult, Result, SearchHit } from '../types'

export const search = (keyword: string, current = 1, size = 10) =>
  unwrap<PageResult<SearchHit>>(
    http.get<Result<PageResult<SearchHit>>>('/api/search', {
      params: { keyword, current, size },
    }),
  )
