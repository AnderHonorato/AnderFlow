import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-utils'
import { chat } from '@/lib/deepseek'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectType: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

    const prompt = `Estime o tempo de desenvolvimento em horas para esta tarefa de software.
Tarefa: ${parsed.data.title}
Descricao: ${parsed.data.description || 'Sem descricao'}
Tipo de projeto: ${parsed.data.projectType || 'CUSTOM'}

Responda APENAS com JSON valido: { "estimatedHours": number, "confidence": "low"|"medium"|"high", "reasoning": string }`

    const { content } = await chat([
      { role: 'system', content: 'Voce e um assistente que estima tempo de tarefas de software. Responda apenas JSON valido.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, maxTokens: 300 })

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      return NextResponse.json({
        data: result || { estimatedHours: 4, confidence: 'low', reasoning: 'Estimativa generica' },
      })
    } catch {
      return NextResponse.json({
        data: { estimatedHours: 4, confidence: 'low', reasoning: 'Nao foi possivel analisar' },
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
