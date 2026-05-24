import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Handler = (req: NextRequest, context?: any) => Promise<NextResponse>

export function withAuth(handler: Handler): Handler {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
      }

      ;(req as any).user = session.user

      return handler(req, context)
    } catch (error) {
      console.error('[withAuth]', error)
      return NextResponse.json({ error: 'Erro de autenticacao' }, { status: 500 })
    }
  }
}
