import { NextRequest, NextResponse } from 'next/server'

// Em produção usar Redis. Para dev, em memória.
const clientActivity = new Map<string, { page: string; lastClick: string; lastUpdate: number }>()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const activity = clientActivity.get(params.id)
  if (!activity) {
    return NextResponse.json({ online: false, page: null, lastClick: null })
  }
  const isOnline = Date.now() - activity.lastUpdate < 120000 // 2 min
  return NextResponse.json({
    online: isOnline,
    page: isOnline ? activity.page : null,
    lastClick: activity.lastClick,
    lastUpdate: new Date(activity.lastUpdate).toISOString(),
  })
}

// POST para registrar atividade
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const { page, click } = body
    clientActivity.set(params.id, {
      page: page || '/portal',
      lastClick: click || '',
      lastUpdate: Date.now(),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
