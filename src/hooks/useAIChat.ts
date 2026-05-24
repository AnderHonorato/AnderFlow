'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  createdAt: string
}

interface UseAIChatOptions {
  onError?: (error: string) => void
  onStreamComplete?: (content: string, reasoning: string) => void
}

interface UseAIChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  streamingContent: string
  streamingReasoning: string
  conversationId: string | null
  sendMessage: (content: string, model?: 'metrys-pro' | 'metrys-flash') => Promise<void>
  clearMessages: () => void
  stopGeneration: () => void
  setConversationId: (id: string | null) => void
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useAIChat(options?: UseAIChatOptions): UseAIChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingReasoning, setStreamingReasoning] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>([])
  const streamContentRef = useRef('')
  const streamReasoningRef = useRef('')

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsLoading(false)
    setStreamingContent('')
    setStreamingReasoning('')
    streamContentRef.current = ''
    streamReasoningRef.current = ''
  }, [])

  const clearMessages = useCallback(() => {
    stopGeneration()
    setMessages([])
    setError(null)
    setConversationId(null)
  }, [stopGeneration])

  const sendMessage = useCallback(
    async (content: string, model: 'metrys-pro' | 'metrys-flash' = 'metrys-pro') => {
      if (!content.trim() || isLoading) return

      stopGeneration()

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      }

      const updatedMessages = [...messagesRef.current, userMessage]
      setMessages(updatedMessages)
      setError(null)
      setIsLoading(true)
      setStreamingContent('')
      setStreamingReasoning('')
      streamContentRef.current = ''
      streamReasoningRef.current = ''

      const ac = new AbortController()
      abortRef.current = ac

      try {
        const payloadMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
          msgId: m.id,
        }))

        const response = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            conversationId: conversationId || undefined,
            modelKey: model,
          }),
          signal: ac.signal,
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.reply || errData.error || `Erro ${response.status}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let fullReasoning = ''

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

            if (parsed.type === 'done') {
              const newCid = parsed.conversationId as string | undefined
              if (newCid && !conversationId) {
                setConversationId(newCid)
              }
            } else if (parsed.type === 'error') {
              throw new Error((parsed.reply as string) || 'Erro desconhecido')
            } else if (parsed.type === 'chunk') {
              const choices = parsed.choices as Array<{ delta?: Record<string, string> }> | undefined
              const delta = choices?.[0]?.delta
              if (delta) {
                if (delta.content) {
                  fullContent += delta.content
                  streamContentRef.current = fullContent
                  setStreamingContent(fullContent)
                }
                if (delta.reasoning_content) {
                  fullReasoning += delta.reasoning_content
                  streamReasoningRef.current = fullReasoning
                  setStreamingReasoning(fullReasoning)
                }
              }
            }
          }
        }

        if (fullContent || fullReasoning) {
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: fullContent || '(sem resposta)',
            reasoning: fullReasoning || undefined,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, assistantMessage])
          options?.onStreamComplete?.(fullContent, fullReasoning)
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const errorMsg = err instanceof Error ? err.message : 'Erro ao comunicar com a IA'
        setError(errorMsg)
        options?.onError?.(errorMsg)
      } finally {
        setIsLoading(false)
        setStreamingContent('')
        setStreamingReasoning('')
        streamContentRef.current = ''
        streamReasoningRef.current = ''
        abortRef.current = null
      }
    },
    [isLoading, conversationId, stopGeneration, options],
  )

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    streamingReasoning,
    conversationId,
    sendMessage,
    clearMessages,
    stopGeneration,
    setConversationId,
  }
}
