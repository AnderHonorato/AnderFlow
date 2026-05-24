import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { cargoParaNivel } from '@/lib/hierarquia'

const adminRoutes = [
  '/users', '/clients', '/crm', '/analytics',
  '/automations', '/files', '/tickets', '/calendar',
  '/settings', '/ai', '/contracts', '/feedbacks-ia', '/audit-logs',
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    // Redirect /chat to /clients
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

    return NextResponse.next()
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
    '/((?!_next/static|_next/image|favicon.ico|branding|manifest.json|sw.js|icon-192.png|icon-512.png|api/).*)',
  ],
}
