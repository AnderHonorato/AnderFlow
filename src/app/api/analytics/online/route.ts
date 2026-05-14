import { NextResponse } from 'next/server'

// Em produção usar Redis, por enquanto em memória
const onlineUsers = new Map<string, number>()
const dailyVisitors = new Set<string>()
const visitLog: { time: number }[] = []

// Limpa visitas antigas a cada hora
setInterval(() => {
  const cutoff = Date.now() - 3600000
  while (visitLog.length && visitLog[0].time < cutoff) visitLog.shift()
  dailyVisitors.clear()
}, 3600000)

export async function GET() {
  const now = Date.now()
  const fiveMinutesAgo = now - 300000

  // Online agora: últimos 5 minutos
  let onlineCount = 0
  onlineUsers.forEach(lastSeen => {
    if (lastSeen > fiveMinutesAgo) onlineCount++
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

export async function POST(req: Request) {
  const { userId, type } = await req.json().catch(() => ({}))
  const now = Date.now()

  if (type === 'ping' || type === 'heartbeat') {
    if (userId) onlineUsers.set(userId, now)
    visitLog.push({ time: now })
    dailyVisitors.add(userId || `anon_${Math.random()}`)
  }

  if (type === 'pageview') {
    visitLog.push({ time: now })
    dailyVisitors.add(userId || `anon_${Math.random()}`)
  }

  return NextResponse.json({ ok: true })
}
