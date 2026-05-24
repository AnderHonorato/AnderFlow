import type { NextRequest, NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  data: T
  error?: string
  meta?: {
    page: number
    pageSize: number
    total: number
  }
}

export interface ApiError {
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse<ApiResponse<T> | ApiError>>
