import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { chat } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { messages } = body
    if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigatórias' }, { status: 400 })

    const [projects, tickets, invoices] = await Promise.all([
      prisma.project.findMany({ where: { clientId: user.id, isArchived: false }, select: { name: true, status: true, progress: true }, take: 10 }),
      prisma.ticket.findMany({ where: { creatorId: user.id }, select: { title: true, status: true }, take: 5 }),
      prisma.invoice.findMany({ where: { clientId: user.id, status: { not: 'PAID' } }, select: { number: true, total: true, dueDate: true, status: true }, take: 5 }),
    ])

    const contextParts = [`Cliente: ${user.name || 'Cliente'}`]
    if (projects.length) contextParts.push(`Projetos: ${projects.map(p => `${p.name} (${p.status}, ${p.progress}%)`).join(', ')}`)
    if (tickets.length) contextParts.push(`Tickets: ${tickets.map(t => `${t.title} (${t.status})`).join(', ')}`)
    if (invoices.length) contextParts.push(`Faturas pendentes: ${invoices.map(i => `${i.number} R$${i.total} vence ${i.dueDate?.toISOString().slice(0, 10) || 'N/A'}`).join(', ')}`)

    const systemMsg = `Você é o assistente virtual da ANDERFLOW Sistemas. Contexto: ${contextParts.join(' | ')}. Responda de forma amigável e concisa (máx 3 frases). Se não souber algo, diga que irá verificar com a equipe. Sempre responda em português.`

    const result = await chat([{ role: 'system', content: systemMsg }, ...messages], { maxTokens: 300 })
    return NextResponse.json({ data: { reply: result.content } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro no chatbot' }, { status: 500 })
  }
}
