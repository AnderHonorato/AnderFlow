import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { code, language, context } = await request.json()
    if (!code) return NextResponse.json({ error: 'code e obrigatorio' }, { status: 400 })

    const prompt = `Revise o seguinte codigo ${language || 'javascript'} e identifique problemas, bugs e sugestoes de melhoria.
Contexto: ${context || 'Nao fornecido'}

Codigo:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

Responda APENAS com JSON:
{
  "issues": [
    { "severity": "critical"|"warning"|"info", "line": number|null, "description": "string", "suggestion": "string" }
  ],
  "summary": "string",
  "score": 0-10
}`

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    const aiJson = await aiResponse.json()
    const rawContent = aiJson.choices?.[0]?.message?.content || ''

    try {
      return NextResponse.json(JSON.parse(rawContent))
    } catch {
      return NextResponse.json({
        issues: [],
        summary: 'Nao foi possivel analisar o codigo.',
        score: 5,
      })
    }
  } catch (error) {
    console.error('[review-code] Error:', error)
    return NextResponse.json({ error: 'Erro ao revisar codigo' }, { status: 500 })
  }
}
