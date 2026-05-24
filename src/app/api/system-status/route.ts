import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const checks: { name: string; status: 'operational' | 'degraded' | 'outage'; latencyMs?: number }[] = []

    const dbStart = Date.now()
    try { await prisma.$queryRawUnsafe('SELECT 1'); checks.push({ name: 'Banco de Dados', status: 'operational', latencyMs: Date.now() - dbStart }) }
    catch { checks.push({ name: 'Banco de Dados', status: 'outage' }) }

    checks.push({ name: 'Email', status: process.env.RESEND_API_KEY ? 'operational' : 'degraded' })
    checks.push({ name: 'WhatsApp', status: process.env.WHATSAPP_API_KEY ? 'operational' : 'degraded' })
    checks.push({ name: 'IA (DeepSeek)', status: process.env.DEEPSEEK_API_KEY ? 'operational' : 'degraded' })

    return NextResponse.json({ data: { components: checks, lastChecked: new Date().toISOString() } })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
