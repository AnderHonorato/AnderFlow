import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'missing-key',
  baseURL: 'https://api.deepseek.com',
})

export const DEEPSEEK_MODELS = {
  chat: 'deepseek-chat',
  reasoner: 'deepseek-reasoner',
} as const

export type DeepSeekModel = (typeof DEEPSEEK_MODELS)[keyof typeof DEEPSEEK_MODELS]

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamChunk {
  content: string
  reasoning: string
}

export async function streamChat(
  messages: ChatMessage[],
  options?: {
    model?: DeepSeekModel
    maxTokens?: number
    temperature?: number
    onChunk?: (chunk: StreamChunk) => void
    signal?: AbortSignal
  },
): Promise<{ content: string; reasoning: string }> {
  const stream = await deepseek.chat.completions.create({
    model: options?.model ?? DEEPSEEK_MODELS.chat,
    messages,
    max_tokens: options?.maxTokens ?? 4000,
    temperature: options?.temperature ?? 0.7,
    stream: true,
  }, {
    signal: options?.signal,
  })

  let content = ''
  let reasoning = ''

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta
    const deltaContent = delta?.content || ''
    const deltaReasoning = (delta as Record<string, string>).reasoning_content || ''

    if (deltaContent) content += deltaContent
    if (deltaReasoning) reasoning += deltaReasoning

    if (options?.onChunk && (deltaContent || deltaReasoning)) {
      options.onChunk({ content: deltaContent, reasoning: deltaReasoning })
    }
  }

  return { content, reasoning }
}

export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: DeepSeekModel
    maxTokens?: number
    temperature?: number
  },
): Promise<{ content: string; reasoning: string }> {
  const completion = await deepseek.chat.completions.create({
    model: options?.model ?? DEEPSEEK_MODELS.chat,
    messages,
    max_tokens: options?.maxTokens ?? 4000,
    temperature: options?.temperature ?? 0.7,
    stream: false,
  })

  const choice = completion.choices[0]?.message
  const msg = choice as unknown as Record<string, string>

  return {
    content: choice?.content ?? '',
    reasoning: msg.reasoning_content ?? '',
  }
}

export default deepseek
