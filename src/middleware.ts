import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://andero.app.br',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  process.env.NODE_ENV === 'development' && 'http://localhost:3001',
].filter(Boolean) as string[]

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_CONFIG = {
  api: { max: 100, window: 60 },
  auth: { max: 10, window: 900 },
  create: { max: 30, window: 60 },
}

function getRateLimitKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `${req.nextUrl.pathname}:${ip}`
}

function checkRateLimit(key: string, config: { max: number; window: number }): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.window * 1000 })
    return true
  }

  if (entry.count >= config.max) {
    return false
  }

  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)

    let config = RATE_LIMIT_CONFIG.api
    if (request.nextUrl.pathname.includes('/auth/')) {
      config = RATE_LIMIT_CONFIG.auth
    } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      config = RATE_LIMIT_CONFIG.create
    }

    if (!checkRateLimit(key, config)) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(config.window),
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
