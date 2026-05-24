import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let dbStatus: { status: string; latencyMs: number | null } = { status: 'outage', latencyMs: null }
  try {
    const start = Date.now()
    await prisma.$queryRawUnsafe('SELECT 1')
    dbStatus = { status: 'operational', latencyMs: Date.now() - start }
  } catch { dbStatus = { status: 'outage', latencyMs: null } }

  const services = [
    { name: 'Email (Resend)', status: process.env.RESEND_API_KEY ? 'operational' : 'degraded', key: !!process.env.RESEND_API_KEY },
    { name: 'IA (DeepSeek)', status: process.env.DEEPSEEK_API_KEY ? 'operational' : 'degraded', key: !!process.env.DEEPSEEK_API_KEY },
    { name: 'WhatsApp', status: process.env.WHATSAPP_API_KEY ? 'operational' : 'degraded', key: !!process.env.WHATSAPP_API_KEY },
  ]

  let version = '0.0.0'
  try {
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    version = pkg.version || '0.0.0'
  } catch {}

  const uptime = process.uptime()

  return NextResponse.json({
    data: {
      db: dbStatus,
      services,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimeSeconds: uptime,
      version,
      timestamp: new Date().toISOString(),
    },
  })
}
