import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { text } = await request.json()
    if (!text) return NextResponse.json({ error: 'Texto e obrigatorio' }, { status: 400 })

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Analise o sentimento deste texto de cliente. Responda APENAS com JSON:
{ "sentiment": "positive"|"neutral"|"negative", "score": 0.0-1.0, "keywords": ["palavra1", "palavra2"] }

Texto: "${text}"`,
        }],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })

    const aiJson = await aiResponse.json()
    const rawContent = aiJson.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(rawContent)
      return NextResponse.json({
        sentiment: parsed.sentiment || 'neutral',
        score: parsed.score || 0.5,
        keywords: parsed.keywords || [],
      })
    } catch {
      return NextResponse.json({
        sentiment: 'neutral',
        score: 0.5,
        keywords: [],
      })
    }
  } catch (error) {
    console.error('[sentiment] Error:', error)
    return NextResponse.json({ sentiment: 'neutral', score: 0.5, keywords: [] })
  }
}
