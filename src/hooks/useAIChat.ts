'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  createdAt: string
  usage?: {
    cache_hit_tokens: number
    cache_miss_tokens: number
  }
}

const STORAGE_KEY = 'anderflow_ai_chat'
const MAX_STORED = 50

function loadMessages(): AIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : []
  } catch {
    return []
  }
}

function saveMessages(messages: AIMessage[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
  } catch {}
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>(() => loadMessages())
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [reasoningContent, setReasoningContent] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<AIMessage[]>(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const sendMessage = useCallback(
    async (content: string, useThinking: boolean = true) => {
      if (!content.trim() || isStreaming) return

      if (abortRef.current) {
        abortRef.current.abort()
      }

      const userMessage: AIMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      }

      const updatedMessages = [...messagesRef.current, userMessage]
      setMessages(updatedMessages)
      setError(null)
      setIsStreaming(true)
      setIsThinking(useThinking)
      setReasoningContent('')
      setStreamingContent('')

      const ac = new AbortController()
      abortRef.current = ac

      const payloadMessages = updatedMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            thinking: useThinking,
          }),
          signal: ac.signal,
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Erro ${response.status}`)
        }

        const contentType = response.headers.get('content-type') || ''

        if (contentType.includes('text/event-stream')) {
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let fullContent = ''
          let fullReasoning = ''
          let usage: AIMessage['usage'] | undefined

          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const data = trimmed.slice(6)
              if (!data) continue

              let parsed: Record<string, unknown>
              try {
                parsed = JSON.parse(data)
              } catch {
                continue
              }

              if (parsed.type === 'reasoning') {
                fullReasoning += (parsed.content as string) || ''
                setReasoningContent(fullReasoning)
                setIsThinking(true)
              } else if (parsed.type === 'content') {
                fullContent += (parsed.content as string) || ''
                setStreamingContent(fullContent)
                setIsThinking(false)
              } else if (parsed.type === 'done') {
                const u = parsed.usage as AIMessage['usage'] | undefined
                if (u) {
                  usage = u
                }
              }
            }
          }

          if (fullContent || fullReasoning) {
            const assistantMessage: AIMessage = {
              id: generateId(),
              role: 'assistant',
              content: fullContent || '(sem resposta)',
              reasoning: fullReasoning || undefined,
              createdAt: new Date().toISOString(),
              usage,
            }
            setMessages((prev) => [...prev, assistantMessage])
          }
        } else {
          const json = await response.json()
          const content = json.content || json.reply || JSON.stringify(json)
          const assistantMessage: AIMessage = {
            id: generateId(),
            role: 'assistant',
            content,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const errorMsg = err instanceof Error ? err.message : 'Erro ao comunicar com a IA'
        setError(errorMsg)
      } finally {
        setIsStreaming(false)
        setIsThinking(false)
        setReasoningContent('')
        setStreamingContent('')
        abortRef.current = null
      }
    },
    [isStreaming],
  )

  const clearMessages = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setMessages([])
    setError(null)
    setIsStreaming(false)
    setIsThinking(false)
    setReasoningContent('')
    setStreamingContent('')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsStreaming(false)
    setIsThinking(false)
    setReasoningContent('')
    setStreamingContent('')
  }, [])

  return {
    messages,
    isStreaming,
    isThinking,
    reasoningContent,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
  }
}
