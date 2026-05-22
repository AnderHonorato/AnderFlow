import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const typingMap = new Map<string, number>()

function cleanExpired() {
  const now = Date.now()
  for (const [key, ts] of typingMap) {
    if (now - ts > 5000) typingMap.delete(key)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { channelId } = await request.json()
    if (!channelId) return NextResponse.json({ error: 'channelId obrigatorio' }, { status: 400 })

    cleanExpired()
    typingMap.set(`${channelId}:${token.id}`, Date.now())

    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId obrigatorio' }, { status: 400 })

    cleanExpired()
    const now = Date.now()
    let typingName: string | null = null

    for (const [key, ts] of typingMap) {
      const [chId, userId] = key.split(':')
      if (chId === channelId && userId !== token.id && now - ts < 3000) {
        typingName = token.name || 'Alguém'
        break
      }
    }

    return NextResponse.json({ data: { typing: typingName !== null, name: typingName } })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
