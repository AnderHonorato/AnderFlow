// ============================================
// DEEPSEEK TYPES — TypeScript interfaces for DeepSeek API
// ============================================

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  reasoning_content?: string
  prefix?: boolean
}

export interface DeepSeekTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
    strict?: boolean
  }
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ThinkingConfig {
  type: 'enabled' | 'disabled'
}

export interface DeepSeekRequestOptions {
  model?: string
  messages: DeepSeekMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  thinking?: ThinkingConfig
  reasoning_effort?: 'low' | 'medium' | 'high'
  tools?: DeepSeekTool[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  response_format?: { type: 'json_object' } | { type: 'text' }
  stop?: string[]
}

export interface UsageStats {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_cache_hit_tokens?: number
  prompt_cache_miss_tokens?: number
  completion_tokens_details?: {
    reasoning_tokens: number
  }
}

export interface DeepSeekChoice {
  index: number
  message?: {
    role: string
    content: string | null
    reasoning_content?: string
    tool_calls?: ToolCall[]
  }
  delta?: {
    role?: string
    content?: string | null
    reasoning_content?: string
    tool_calls?: ToolCall[]
  }
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter'
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: DeepSeekChoice[]
  usage?: UsageStats
}

export interface DeepSeekStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: string
      content?: string | null
      reasoning_content?: string
      tool_calls?: ToolCall[]
    }
    finish_reason?: string | null
  }[]
  usage?: UsageStats
}

export interface ChatResult {
  content: string
  reasoning: string
  toolCalls: ToolCall[]
  usage?: UsageStats
  model: string
}

export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  thinking?: boolean
  reasoningEffort?: 'low' | 'medium' | 'high'
  tools?: DeepSeekTool[]
  responseFormat?: 'json' | 'text'
  signal?: AbortSignal
  onChunk?: (chunk: StreamChunkData) => void
}

export interface StreamChunkData {
  content: string
  reasoning: string
  toolCalls?: ToolCall[]
  finishReason?: string
  usage?: UsageStats
}

export type DeepSeekModel = 'deepseek-v4-flash' | 'deepseek-v4-pro' | 'deepseek-chat' | 'deepseek-reasoner'

export const DEEPSEEK_MODELS = {
  chat: 'deepseek-chat' as const,
  reasoner: 'deepseek-reasoner' as const,
  v4Flash: 'deepseek-v4-flash' as const,
  v4Pro: 'deepseek-v4-pro' as const,
} as const

export interface AiUsageLog {
  id: string
  timestamp: Date
  model: string
  endpoint: string
  inputTokens: number
  outputTokens: number
  cacheHitTokens: number
  cacheMissTokens: number
  costUsd: number
  durationMs: number
  feature: string
  userId?: string
}

export interface CacheSavings {
  savedTokens: number
  savedCost: number
  hitTokens: number
  missTokens: number
}

export { type ChatMessage, type StreamChunk } from '@/lib/deepseek'
