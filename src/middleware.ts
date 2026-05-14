import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Rotas exclusivas do admin — clientes NUNCA podem acessar
const adminRoutes = [
  '/dashboard', '/projects', '/clients', '/crm', '/chat',
  '/financial', '/contracts', '/analytics', '/automations',
  '/ai', '/audit-logs', '/files', '/tickets',
  '/calendar', '/onboarding', '/settings',
]

// Rotas permitidas para todos (admin + cliente)
const sharedRoutes = [
  '/portal', '/profile', '/notifications', '/help',
  '/plans', '/changelog', '/feedback',
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const role = (token?.role as string) || 'CLIENT'

    // Cliente tentando acessar rota de admin → redireciona pro portal
    if (role === 'CLIENT') {
      const isAdminRoute = adminRoutes.some(r => path === r || path.startsWith(r + '/'))
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/portal', req.url))
      }
    }

    // Admin acessando /portal → deixa passar (admin pode ver portal do cliente)
    // Admin acessando /login → redireciona pro dashboard

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Rotas públicas — qualquer um acessa
        if (
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/api/auth')
        ) {
          return true
        }

        // Precisa estar logado para o resto
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/clients/:path*',
    '/crm/:path*',
    '/chat/:path*',
    '/financial/:path*',
    '/contracts/:path*',
    '/tickets/:path*',
    '/files/:path*',
    '/analytics/:path*',
    '/automations/:path*',
    '/ai/:path*',
    '/calendar/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/help/:path*',
    '/portal/:path*',
    '/profile/:path*',
    '/plans/:path*',
    '/changelog/:path*',
    '/feedback/:path*',
    '/audit-logs/:path*',
  ],
}
