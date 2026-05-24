import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { text, context } = body
    if (!text?.trim()) return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 })

    const prompt = `Melhore o seguinte texto para comunicação profissional com cliente de software. Mantenha a intenção original. ${context ? `Contexto: ${context}. ` : ''}Responda APENAS com o texto melhorado, sem explicações, sem aspas, sem markdown:\n\n${text}`

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    const json = await res.json()
    const improved = json.choices?.[0]?.message?.content?.trim() || text
    return NextResponse.json({ improved })
  } catch {
    return NextResponse.json({ error: 'Erro ao melhorar texto' }, { status: 500 })
  }
}
