import { NextRequest } from 'next/server'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_RETRIES = 3

function getErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Formato de requisicao invalido'
    case 401: return 'Chave de API invalida. Verifique DEEPSEEK_API_KEY'
    case 402: return 'Saldo insuficiente na API DeepSeek'
    case 422: return 'Parametros invalidos na requisicao'
    case 429: return 'Muitas requisicoes. Aguarde um momento'
    case 500: return 'Erro interno do servidor DeepSeek'
    case 503: return 'Servidor DeepSeek sobrecarregado. Tente novamente'
    default: return `Erro ${status} ao processar`
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const encoder = new TextEncoder()

  try {
    const body = await request.json()
    const { messages, thinking = false, tools } = body as {
      messages: { role: string; content: string }[]
      thinking?: boolean
      tools?: Record<string, unknown>[]
    }

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Mensagens obrigatorias' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chave de API nao configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'

    const bodyParams: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    }

    if (thinking) {
      bodyParams.thinking = { type: 'enabled' }
    }

    if (tools?.length) {
      bodyParams.tools = tools
    }

    let streamResponse: Response | null = null
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(bodyParams),
        })

        if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt === MAX_RETRIES) {
          streamResponse = res
          break
        }

        console.warn(`[AI Chat] Retry ${attempt + 1}/${MAX_RETRIES} — status ${res.status}`)
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise((r) => setTimeout(r, delay))
      } catch (e) {
        lastError = e as Error
        if (attempt === MAX_RETRIES) break
        console.warn(`[AI Chat] Retry ${attempt + 1}/${MAX_RETRIES} — network error: ${(e as Error).message}`)
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise((r) => setTimeout(r, delay))
      }
    }

    if (!streamResponse) {
      throw lastError || new Error('Falha ao conectar com a API DeepSeek')
    }

    if (!streamResponse.ok) {
      const errText = await streamResponse.text().catch(() => '')
      console.error(`[AI Chat] DeepSeek ${streamResponse.status}:`, errText.slice(0, 300))
      return new Response(JSON.stringify({ error: getErrorMessage(streamResponse.status) }), {
        status: streamResponse.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = streamResponse!.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let finalUsage: Record<string, number> | null = null

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const data = trimmed.slice(6)
              if (data === '[DONE]') continue

              let parsed: any
              try {
                parsed = JSON.parse(data)
              } catch {
                continue
              }

              const delta = parsed?.choices?.[0]?.delta
              const finishReason = parsed?.choices?.[0]?.finish_reason

              if (delta?.reasoning_content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`,
                  ),
                )
              }

              if (delta?.content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`,
                  ),
                )
              }

              if (delta?.tool_calls?.length) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'tool_call', tool_calls: delta.tool_calls, finish_reason: finishReason || null })}\n\n`,
                  ),
                )
              }

              if (parsed.usage) {
                finalUsage = {
                  prompt_tokens: parsed.usage.prompt_tokens || 0,
                  completion_tokens: parsed.usage.completion_tokens || 0,
                  total_tokens: parsed.usage.total_tokens || 0,
                  cache_hit_tokens: parsed.usage.prompt_cache_hit_tokens || 0,
                  cache_miss_tokens: parsed.usage.prompt_cache_miss_tokens || 0,
                  reasoning_tokens:
                    parsed.usage.completion_tokens_details?.reasoning_tokens || 0,
                }
              }
            }
          }
        } catch (e) {
          console.error('[AI Chat] Stream read error:', e)
        }

        const durationMs = Date.now() - startTime

        const donePayload: Record<string, unknown> = {
          type: 'done',
          model,
          duration_ms: durationMs,
        }

        if (finalUsage) {
          donePayload.usage = finalUsage
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    console.error('[AI Chat] Fatal error:', e)
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done', error: 'Erro interno ao processar. Tente novamente.' })}\n\n`,
          ),
        )
        controller.close()
      },
    })

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }
}
