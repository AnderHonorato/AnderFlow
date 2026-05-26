// ============================================
// DEEPSEEK CLIENT — ChatGPT-compatible API via fetch
// Suporte completo: Thinking Mode, Streaming, Tools, JSON Output, Retry, Cache Tracking
// ============================================

import type {
  DeepSeekMessage,
  DeepSeekTool,
  ToolCall,
  DeepSeekResponse,
  DeepSeekStreamChunk,
  ChatResult,
  ChatOptions,
  StreamChunkData,
  UsageStats,
} from '@/lib/deepseek-types'
import { AI_CONFIG } from '@/lib/ai-config'

const BASE_URL = AI_CONFIG.deepseek.baseUrl
const API_KEY = () => AI_CONFIG.deepseek.apiKey || process.env.DEEPSEEK_API_KEY || ''

// ============================================
// TIPOS PÚBLICOS (re-exportados para compatibilidade)
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  reasoning_content?: string
}

export interface StreamChunk {
  content: string
  reasoning: string
}

export { type DeepSeekModel, DEEPSEEK_MODELS } from '@/lib/deepseek-types'
export type { ToolCall, DeepSeekTool, UsageStats, ChatResult }

// ============================================
// RETRY LOGIC
// ============================================

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503])
const MAX_RETRIES = 3

async function retryableFetch(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (!RETRYABLE_STATUSES.has(res.status) || attempt === retries) {
        return res
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise((r) => setTimeout(r, delay))
    } catch (e) {
      if (attempt === retries) throw e
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// ============================================
// ERROR HANDLING
// ============================================

function getErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Formato de requisição inválido'
    case 401: return 'Chave de API inválida. Verifique DEEPSEEK_API_KEY'
    case 402: return 'Saldo insuficiente na API DeepSeek'
    case 422: return 'Parâmetros inválidos na requisição'
    case 429: return 'Muitas requisições. Aguarde um momento'
    case 500: return 'Erro interno do servidor DeepSeek'
    case 503: return 'Servidor DeepSeek sobrecarregado'
    default: return `Erro ${status} ao processar`
  }
}

// ============================================
// USAGE / COST TRACKING
// ============================================

export function estimateCost(usage: UsageStats, model?: string): number {
  const isPro = model?.includes('pro') || model?.includes('v4-pro')
  const pricing = isPro ? AI_CONFIG.pricing.pro : AI_CONFIG.pricing.flash

  const cacheHit = usage.prompt_cache_hit_tokens || 0
  const cacheMiss = (usage.prompt_tokens || 0) - cacheHit
  const output = usage.completion_tokens || 0

  const inputCost = (cacheHit * pricing.cacheHit + cacheMiss * pricing.input) / 1_000_000
  const outputCost = (output * pricing.output) / 1_000_000

  return Math.round((inputCost + outputCost) * 10000) / 10000
}

export function estimateCacheSavings(usage: UsageStats): { savedTokens: number; savedCost: number } {
  const cacheHit = usage.prompt_cache_hit_tokens || 0
  const savedCost = cacheHit * (0.14 - 0.0028) / 1_000_000
  return {
    savedTokens: cacheHit,
    savedCost: Math.round(savedCost * 10000) / 10000,
  }
}

// ============================================
// CORE API CALL (non-streaming)
// ============================================

export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
    thinking?: boolean
    reasoningEffort?: 'low' | 'medium' | 'high'
    tools?: DeepSeekTool[]
    responseFormat?: 'json' | 'text'
    signal?: AbortSignal
  },
): Promise<ChatResult> {
  const apiKey = API_KEY()
  const model = options?.model ?? AI_CONFIG.deepseek.model

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options?.maxTokens ?? AI_CONFIG.defaults.maxTokens,
    temperature: options?.temperature ?? AI_CONFIG.defaults.temperature,
    stream: false,
  }

  const useThinking = options?.thinking ?? AI_CONFIG.defaults.thinkingEnabled
  if (useThinking) {
    body.thinking = { type: 'enabled' }
    if (options?.reasoningEffort) {
      body.reasoning_effort = options.reasoningEffort
    }
  }

  if (options?.tools?.length) {
    body.tools = options.tools
  }

  if (options?.responseFormat === 'json') {
    body.response_format = { type: 'json_object' }
  }

  const res = await retryableFetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[DeepSeek] ${res.status}:`, errText.slice(0, 300))
    throw new Error(getErrorMessage(res.status))
  }

  const data: DeepSeekResponse = await res.json()
  const choice = data.choices?.[0]
  const msg = choice?.message

  const toolCalls: ToolCall[] = msg?.tool_calls || []
  let content = msg?.content || ''
  const reasoning = msg?.reasoning_content || ''

  if (!content && toolCalls.length > 0) {
    content = ''
  }

  return {
    content,
    reasoning,
    toolCalls,
    usage: data.usage,
    model: data.model,
  }
}

// ============================================
// STREAMING CHAT
// ============================================

export async function streamChat(
  messages: ChatMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
    thinking?: boolean
    reasoningEffort?: 'low' | 'medium' | 'high'
    tools?: DeepSeekTool[]
    onChunk?: (chunk: StreamChunk) => void
    onToolCall?: (toolCalls: ToolCall[]) => void
    signal?: AbortSignal
  },
): Promise<ChatResult> {
  const apiKey = API_KEY()
  const model = options?.model ?? AI_CONFIG.deepseek.model

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options?.maxTokens ?? AI_CONFIG.defaults.maxTokens,
    temperature: options?.temperature ?? AI_CONFIG.defaults.temperature,
    stream: true,
  }

  const useThinking = options?.thinking ?? AI_CONFIG.defaults.thinkingEnabled
  if (useThinking) {
    body.thinking = { type: 'enabled' }
    if (options?.reasoningEffort) {
      body.reasoning_effort = options.reasoningEffort
    }
  }

  if (options?.tools?.length) {
    body.tools = options.tools
  }

  const res = await retryableFetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[DeepSeek Stream] ${res.status}:`, errText.slice(0, 300))
    throw new Error(getErrorMessage(res.status))
  }

  let content = ''
  let reasoning = ''
  const toolCalls: ToolCall[] = []
  let finalUsage: UsageStats | undefined

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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

      try {
        const parsed: DeepSeekStreamChunk = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta

        if (delta) {
          const deltaContent = delta.content || ''
          const deltaReasoning = delta.reasoning_content || ''
          const deltaToolCalls = delta.tool_calls || []

          if (deltaContent) content += deltaContent
          if (deltaReasoning) reasoning += deltaReasoning

          if (deltaToolCalls.length > 0) {
            for (const tc of deltaToolCalls) {
              const existing = toolCalls.find((t) => t.id === tc.id)
              if (existing) {
                if (tc.function?.arguments) {
                  existing.function.arguments += tc.function.arguments
                }
              } else {
                toolCalls.push({ ...tc })
              }
            }
          }

          if (options?.onChunk && (deltaContent || deltaReasoning)) {
            options.onChunk({ content: deltaContent, reasoning: deltaReasoning })
          }
        }

        if (parsed.usage) {
          finalUsage = parsed.usage
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  if (toolCalls.length > 0 && options?.onToolCall) {
    options.onToolCall(toolCalls)
  }

  return {
    content: content || (toolCalls.length > 0 ? '' : ''),
    reasoning,
    toolCalls,
    usage: finalUsage,
    model,
  }
}

// ============================================
// HIGH-LEVEL HELPERS
// ============================================

export async function chatJson<T = Record<string, unknown>>(
  messages: ChatMessage[],
  options?: {
    model?: string
    maxTokens?: number
    thinking?: boolean
    signal?: AbortSignal
  },
): Promise<{ data: T; reasoning: string; usage?: UsageStats }> {
  const res = await chat(messages, {
    ...options,
    responseFormat: 'json',
    temperature: 0.3,
  })

  let parsed: T
  try {
    parsed = JSON.parse(res.content)
  } catch {
    const match = res.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    parsed = match ? JSON.parse(match[0]) : ({} as T)
  }

  return { data: parsed, reasoning: res.reasoning, usage: res.usage }
}

export async function chatWithTools(
  messages: ChatMessage[],
  tools: DeepSeekTool[],
  toolExecutor: (name: string, args: Record<string, unknown>) => Promise<string>,
  options?: {
    model?: string
    maxTokens?: number
    thinking?: boolean
    reasoningEffort?: 'low' | 'medium' | 'high'
    maxIterations?: number
    signal?: AbortSignal
  },
): Promise<ChatResult> {
  const maxIter = options?.maxIterations ?? 5
  let currentMessages = [...messages]
  let finalResult: ChatResult | null = null

  for (let i = 0; i < maxIter; i++) {
    const res = await chat(currentMessages, {
      model: options?.model,
      maxTokens: options?.maxTokens,
      thinking: options?.thinking,
      reasoningEffort: options?.reasoningEffort,
      tools,
      signal: options?.signal,
    })

    if (res.toolCalls.length === 0) {
      return res
    }

    const assistantMsg: DeepSeekMessage = {
      role: 'assistant',
      content: res.content || null,
      tool_calls: res.toolCalls,
      reasoning_content: res.reasoning || undefined,
    }
    currentMessages.push(assistantMsg)

    for (const tc of res.toolCalls) {
      const fn = tc.function
      let toolResult: string
      try {
        const args = JSON.parse(fn.arguments || '{}')
        toolResult = await toolExecutor(fn.name, args)
      } catch (e) {
        toolResult = JSON.stringify({ error: String(e) })
      }

      currentMessages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: tc.id,
      })
    }

    finalResult = res
  }

  return finalResult || { content: '', reasoning: '', toolCalls: [], model: options?.model || '' }
}

// ============================================
// OPENAI SDK WRAPPER (backward compatibility)
// ============================================

let _openaiClient: unknown = null

function getOpenAI() {
  if (!_openaiClient) {
    try {
      const OpenAI = require('openai').default
      _openaiClient = new OpenAI({
        apiKey: API_KEY(),
        baseURL: BASE_URL,
      })
    } catch {
      _openaiClient = null
    }
  }
  return _openaiClient
}

const proxy = new Proxy({} as Record<string, unknown>, {
  get(_, prop) {
    const client = getOpenAI()
    return client ? (client as Record<string, unknown>)[prop as string] : undefined
  },
})

export default proxy
