import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

declare global { var presenceMap: Map<string, { adminId: string; lastSeen: number }> }
global.presenceMap = global.presenceMap || new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ active: false })

  const entry = global.presenceMap.get(projectId)
  const active = entry ? (Date.now() - entry.lastSeen < 45000) : false
  return NextResponse.json({ active, lastSeen: entry?.lastSeen ? new Date(entry.lastSeen).toISOString() : null })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  try {
    const body = await request.json()
    const { projectId, clear } = body
    if (!projectId) return NextResponse.json({ error: 'projectId obrigatório' }, { status: 400 })

    if (clear) {
      global.presenceMap.delete(projectId)
    } else {
      global.presenceMap.set(projectId, { adminId: user.id, lastSeen: Date.now() })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
