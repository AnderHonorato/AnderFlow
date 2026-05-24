import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { chat } from '@/lib/deepseek'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 80) return unauthorizedResponse()

  const { id } = await params
  const body = await request.json()
  const { transcript } = body

  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ error: 'Transcricao obrigatoria' }, { status: 400 })
  }

  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting) {
    return NextResponse.json({ error: 'Reuniao nao encontrada' }, { status: 404 })
  }

  const result = await chat([
    {
      role: 'system',
      content: 'Voce e um assistente que analisa transcricoes de reunioes. Extraia: 1) Resumo executivo (3-5 linhas em portugues), 2) Lista de acoes com responsavel e prazo se mencionado. Responda APENAS um JSON valido no formato: {"summary": "...", "actions": [{"action": "...", "assignee": "...", "dueDate": "..."}]}. Se nao houver informacao suficiente para algum campo, use null.',
    },
    {
      role: 'user',
      content: `Analise esta transcricao de reuniao e extraia o resumo e as acoes:\n\n${transcript}`,
    },
  ])

  let summary = ''
  let actions: any[] = []

  try {
    const parsed = JSON.parse(result.content)
    summary = parsed.summary || ''
    actions = Array.isArray(parsed.actions) ? parsed.actions : []
  } catch {
    // Fallback: try to extract JSON from the response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        summary = parsed.summary || ''
        actions = Array.isArray(parsed.actions) ? parsed.actions : []
      } catch {
        summary = result.content.slice(0, 500)
      }
    } else {
      summary = result.content.slice(0, 500)
    }
  }

  const updated = await prisma.meeting.update({
    where: { id },
    data: {
      transcript,
      summary,
      actions: actions.length > 0 ? JSON.parse(JSON.stringify(actions)) : null,
    },
  })

  return NextResponse.json({
    data: {
      id: updated.id,
      summary: updated.summary,
      actions: updated.actions,
    },
  })
}
