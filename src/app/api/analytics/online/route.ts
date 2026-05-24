import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { cargoParaNivel } from '@/lib/hierarquia'

// Em produção usar Redis, por enquanto em memória
const onlineUsers = new Map<string, { lastSeen: number; busy: boolean }>()
const dailyVisitors = new Set<string>()
const visitLog: { time: number }[] = []

// Limpa visitas antigas a cada hora
setInterval(() => {
  const cutoff = Date.now() - 3600000
  while (visitLog.length && visitLog[0].time < cutoff) visitLog.shift()
  dailyVisitors.clear()
}, 3600000)

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || cargoParaNivel(token.role as string) < 40) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }
  const now = Date.now()
  const fiveMinutesAgo = now - 300000

  // Online agora: últimos 5 minutos
  let onlineCount = 0
  onlineUsers.forEach(data => {
    if (data.lastSeen > fiveMinutesAgo) onlineCount++
  })

  // Máximo simultâneo 
  let maxSimultaneous = onlineCount
  const windowMs = 300000
  for (let i = visitLog.length - 1; i >= 0; i--) {
    const windowStart = visitLog[i].time - windowMs
    let count = 0
    for (let j = i; j >= 0; j--) {
      if (visitLog[j].time >= windowStart) count++
      else break
    }
    if (count > maxSimultaneous) maxSimultaneous = count
  }

  return NextResponse.json({
    onlineNow: onlineCount,
    maxSimultaneous,
    totalVisitsToday: dailyVisitors.size,
    totalVisitsHour: visitLog.length,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, type, busy } = body

  // Verify the requesting user matches or is admin
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (userId && token?.id !== userId) {
    const isAdminUser = cargoParaNivel(token?.role as string) >= 40
    if (!isAdminUser) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }
  const now = Date.now()

  if (type === 'ping' || type === 'heartbeat') {
    if (userId) onlineUsers.set(userId, { lastSeen: now, busy: !!busy })
    visitLog.push({ time: now })
    dailyVisitors.add(userId || `anon_${Math.random()}`)
  }

  if (type === 'pageview') {
    visitLog.push({ time: now })
    dailyVisitors.add(userId || `anon_${Math.random()}`)
  }

  return NextResponse.json({ ok: true })
}
