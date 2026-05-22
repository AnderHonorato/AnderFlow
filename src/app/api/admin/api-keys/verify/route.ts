import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner } from '@/lib/auth-utils'
import { decryptKey } from '@/lib/api-keys'

const PROVIDER_URLS: Record<string, { url: string; headers: (key: string) => Record<string, string>; model: string }> = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/models',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    model: 'deepseek-chat',
  },
  openai: {
    url: 'https://api.openai.com/v1/models',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    model: 'gpt-4o-mini',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
    headers: (_key: string) => ({}),
    model: 'gemini-2.0-flash',
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key: string) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
    model: 'claude-3-haiku-20240307',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/models',
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
    model: 'mistral-small-latest',
  },
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 })
    }

    const keyRow = await prisma.apiKey.findUnique({ where: { id } })
    if (!keyRow) {
      return NextResponse.json({ error: 'Chave nao encontrada.' }, { status: 404 })
    }

    let decrypted: string
    try {
      decrypted = decryptKey(keyRow.keyHash)
    } catch {
      return NextResponse.json({ status: 'error', message: 'Erro ao descriptografar a chave.' })
    }

    if (!decrypted || decrypted.length < 5) {
      return NextResponse.json({ status: 'error', message: 'Chave parece estar vazia ou invalida.' })
    }

    const provider = PROVIDER_URLS[keyRow.provider]
    if (!provider) {
      return NextResponse.json({ status: 'error', message: `Provedor "${keyRow.provider}" nao suporta verificacao ainda.` })
    }

    let url = provider.url
    let bodyPayload: string | undefined

    // Gemini uses query param, not header
    if (keyRow.provider === 'gemini') {
      url = provider.url + decrypted
    }

    const extraHeaders = provider.headers(decrypted)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const fetchOpts: RequestInit = {
        method: 'GET',
        headers: { ...extraHeaders },
        signal: controller.signal,
      }

      if (keyRow.provider === 'claude') {
        fetchOpts.method = 'POST'
        fetchOpts.body = JSON.stringify({
          model: provider.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        })
      }

      const res = await fetch(url, fetchOpts)
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const models = data?.data || data?.models || data
        const hasModels = Array.isArray(models) && models.length > 0
        return NextResponse.json({
          status: 'ok',
          message: hasModels
            ? `Funcionando — ${models.length} modelos disponiveis`
            : 'Funcionando — conectado com sucesso',
        })
      }

      // Try to parse error for specific messages
      let errorText = ''
      try {
        const errData = await res.json()
        errorText = errData?.error?.message || errData?.error?.code || errData?.message || ''
      } catch {
        errorText = res.statusText || ''
      }

      const status = res.status
      if (status === 401 || status === 403) {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Chave invalida ou acesso negado.' })
      }
      if (status === 429) {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Cota excedida. Tente novamente mais tarde.' })
      }
      if (status === 402) {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Saldo insuficiente ou pagamento necessario.' })
      }
      if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('cota') || errorText.toLowerCase().includes('exceeded') || errorText.toLowerCase().includes('rate limit')) {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Cotas esgotadas ou limite de taxa excedido.' })
      }
      if (errorText.toLowerCase().includes('billing') || errorText.toLowerCase().includes('payment') || errorText.toLowerCase().includes('insufficient')) {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Problema de cobranca ou saldo.' })
      }

      return NextResponse.json({
        status: 'error',
        message: `Nao funcionando — Erro HTTP ${status}${errorText ? ': ' + errorText.slice(0, 80) : '.'}`,
      })

    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ status: 'error', message: 'Nao funcionando — Timeout ao conectar.' })
      }
      return NextResponse.json({
        status: 'error',
        message: `Nao funcionando — ${fetchError?.message?.slice(0, 80) || 'Erro de conexao.'}`,
      })
    }

  } catch (error: any) {
    console.error('[api-keys verify] error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao verificar chave.' }, { status: 500 })
  }
}
