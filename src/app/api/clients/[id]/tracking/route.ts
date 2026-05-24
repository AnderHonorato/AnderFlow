import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { cargoParaNivel } from '@/lib/hierarquia'

const clientActivity = new Map<string, { page: string; lastClick: string; lastUpdate: number }>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || cargoParaNivel(token.role as string) < 40) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }
  const activity = clientActivity.get(id)
  if (!activity) {
    return NextResponse.json({ online: false, page: null, lastClick: null })
  }
  const isOnline = Date.now() - activity.lastUpdate < 120000
  return NextResponse.json({
    online: isOnline,
    page: isOnline ? activity.page : null,
    lastClick: activity.lastClick,
    lastUpdate: new Date(activity.lastUpdate).toISOString(),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAdminUser = cargoParaNivel(token?.role as string) >= 40
  if (!token || (token.id !== id && !isAdminUser)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const { page, click } = body
    clientActivity.set(id, {
      page: page || '/portal',
      lastClick: click || '',
      lastUpdate: Date.now(),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
