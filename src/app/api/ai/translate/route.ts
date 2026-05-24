import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-utils'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

function detectIsEnglish(text: string): boolean {
  const pt = /[áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]/.test(text)
  if (pt) return false
  const enWords = /\b(the|and|for|that|this|with|from|have|are|not|but|you|all|can|has|was|will|would|about|which|their|what|when|make|like|time|just|know|take|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|even|new|want|because|any|these|give|day|most|us|very|need|should|going|called|each|tell|does|set|three|put|end|does|another|well|large|must|big|even|such|turn|here|why|ask|went|men|read|show|name|found|hand|keep|start|just|might|every|own|under|last|never|same|another|began|thought|still|found|leave|while|between|world|high|next|life|below)\b/i.test(text)
  if (enWords) return true
  const nonAscii = /[^\x00-\x7F]/.test(text.replace(/[áàãâéêíóôõúüç]/gi, ''))
  if (nonAscii) return false
  return text.length > 80 && enWords || /\b(i|we|he|she|it|they|me|him|her|us|them|my|our|your|his|its|their|mine|ours|yours|hers|theirs)\b/i.test(text)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { text } = body

    if (!text || text.length < 10) {
      return NextResponse.json({ translated: text || '', changed: false })
    }

    if (!detectIsEnglish(text)) {
      return NextResponse.json({ translated: text, changed: false })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ translated: text, changed: false, error: 'no key' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um tradutor. Traduza o texto a seguir para portugues do Brasil. Retorne APENAS a traducao, sem explicacoes, sem aspas, sem notas. Mantenha termos tecnicos em ingles apenas se necessario.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: Math.min(4096, Math.ceil(text.length * 2)),
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({ translated: text, changed: false, error: 'api error' })
    }

    const data = await res.json()
    const translated = data?.choices?.[0]?.message?.content?.trim() || text

    return NextResponse.json({ translated, changed: translated !== text })
  } catch (error: any) {
    console.error('[translate] error:', error?.message || error)
    return NextResponse.json({ translated: '', changed: false, error: 'exception' })
  }
}
