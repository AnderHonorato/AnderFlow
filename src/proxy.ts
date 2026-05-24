import { withAuth } from 'next-auth/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cargoParaNivel } from '@/lib/hierarquia'

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

function applyCorsAndRateLimit(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('Access-Control-Max-Age', '86400')
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    const key = getRateLimitKey(req)

    let config = RATE_LIMIT_CONFIG.api
    if (req.nextUrl.pathname.includes('/auth/')) {
      config = RATE_LIMIT_CONFIG.auth
    } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
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

  return null
}

const adminRoutes = [
  '/users', '/clients', '/crm', '/analytics',
  '/automations', '/files', '/tickets', '/calendar',
  '/settings', '/ai', '/contracts', '/feedbacks-ia', '/audit-logs',
]

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next()

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }

    const rateLimitResponse = applyCorsAndRateLimit(req, response)
    if (rateLimitResponse) return rateLimitResponse

    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return response

    if (path === '/chat' || path.startsWith('/chat/')) {
      return NextResponse.redirect(new URL('/clients', req.url))
    }

    const roleLevel = cargoParaNivel(token?.role as string)

    const isAdminRoute = adminRoutes.some(r => path === r || path.startsWith(r + '/'))

    if (isAdminRoute) {
      const isUsersRoute = path === '/users' || path.startsWith('/users/')
      const requiredLevel = isUsersRoute ? 100 : 60

      if (roleLevel < requiredLevel) {
        if (roleLevel === 0) {
          return NextResponse.redirect(new URL('/login', req.url))
        }
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        if (
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/pre-register') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/termos') ||
          path.startsWith('/briefing-public') ||
          path.startsWith('/api/auth')
        ) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|branding|manifest.json|sw.js|icon-192.png|icon-512.png).*)',
  ],
}
