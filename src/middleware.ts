import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const adminOnlyRoutes = [
  '/users', '/audit-logs', '/clients', '/crm', '/analytics',
  '/automations', '/files', '/tickets', '/calendar', '/onboarding', '/settings',
  '/knowledge', '/ai', '/contracts',
]

const clientAllowedRoutes = [
  '/dashboard', '/profile', '/notifications', '/help',
  '/plans', '/changelog', '/feedback',
  '/projects', '/chat', '/financial',
  '/portal',
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const role = (token?.role as string) || 'CLIENT'

    if (!token) return NextResponse.next()

    // Redirect /chat to /clients
    if (path === '/chat' || path.startsWith('/chat/')) {
      return NextResponse.redirect(new URL('/clients', req.url))
    }

    // CLIENT: bloquear rotas administrativas
    if (role === 'CLIENT') {
      const isAdminRoute = adminOnlyRoutes.some(r => path === r || path.startsWith(r + '/'))
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // ADMIN acessando /portal: permitir
    if (role === 'ADMIN' && path === '/portal') {
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        if (
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/forgot-password') ||
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
    '/((?!_next/static|_next/image|favicon.ico|branding|api/).*)',
  ],
}
