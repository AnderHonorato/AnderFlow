import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { ticketId } = await request.json()
    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId obrigatorio' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket nao encontrado' }, { status: 404 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY nao configurada' }, { status: 500 })
    }

    const systemPrompt = `Voce e um assistente de suporte para uma empresa de desenvolvimento de software chamada ANDERFLOW Sistemas.
Analise o ticket e responda APENAS com JSON valido no seguinte formato, sem texto adicional:
{
  "category": "bug" | "feature" | "duvida" | "urgente",
  "priority": "low" | "medium" | "high" | "critical",
  "suggestedReply": "texto da resposta sugerida em portugues, profissional e cordial"
}`

    const userPrompt = `Analise este ticket de suporte:
Titulo: ${ticket.title}
Descricao: ${ticket.description}`

    let aiCategory: string | null = null
    let aiPriority: string | null = null
    let aiSuggestedReply: string | null = null

    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 500,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!res.ok) {
        console.error('[analyze-ticket] DeepSeek API error:', await res.text())
        return NextResponse.json({ ok: false, error: 'Erro na API de IA' }, { status: 500 })
      }

      const json = await res.json()
      const rawText = json.choices?.[0]?.message?.content || ''

      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        aiCategory = parsed.category || null
        aiPriority = parsed.priority || null
        aiSuggestedReply = parsed.suggestedReply || null
      }
    } catch (err: any) {
      console.error('[analyze-ticket] Parse error:', err)
      return NextResponse.json({ ok: false, error: 'Erro ao processar resposta da IA' }, { status: 500 })
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { aiCategory, aiPriority, aiSuggestedReply },
    })

    return NextResponse.json({ ok: true, category: aiCategory, priority: aiPriority, suggestedReply: aiSuggestedReply })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
