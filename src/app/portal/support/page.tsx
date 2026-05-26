'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Sparkles, AlertCircle, Brain, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  createdAt: string
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export default function PortalSupportPage() {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingReasoning, setStreamingReasoning] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isLoading || !session?.user) return
    setInput('')
    setError(null)

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setStreamingContent('')
    setStreamingReasoning('')

    const ac = new AbortController()
    abortRef.current = ac

    try {
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          modelKey: 'metrys-flash',
        }),
        signal: ac.signal,
      })

      if (!res.ok) throw new Error(`Erro ${res.status}`)

      const reader = res.body!.getReader()
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

          let parsed: any
          try { parsed = JSON.parse(data) } catch { continue }

          if (parsed.type === 'error') throw new Error(parsed.reply || 'Erro')
          if (parsed.type === 'chunk') {
            const delta = parsed.choices?.[0]?.delta
            if (delta?.content) {
              fullContent += delta.content
              setStreamingContent(fullContent)
            }
            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content
              setStreamingReasoning(fullReasoning)
            }
          }
        }
      }

      if (fullContent || fullReasoning) {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          content: fullContent || '(sem resposta)',
          reasoning: fullReasoning || undefined,
          createdAt: new Date().toISOString(),
        }])
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Erro ao comunicar com o assistente')
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      setStreamingReasoning('')
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Assistente IA</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Faca login para conversar com o assistente
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div>
          <h1 className="text-lg font-medium">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">Tire duvidas sobre seus projetos</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Metrys IA
        </Badge>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <Bot className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Pergunte sobre status de projetos, faturas, prazos ou qualquer duvida sobre a plataforma.
            </p>
          </div>
        )}

        <div className="space-y-4 py-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}>
                {msg.reasoning && (
                  <details className="mb-1.5">
                    <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Pensamento
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap border-l-2 border-muted-foreground/20 pl-2">
                      {msg.reasoning}
                    </p>
                  </details>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex gap-2 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-xl px-3 py-2 bg-card border border-border">
                {streamingReasoning && (
                  <details className="mb-1.5" open>
                    <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      <Brain className="h-3 w-3 animate-pulse" />
                      Pensando...
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap border-l-2 border-muted-foreground/20 pl-2">
                      {streamingReasoning}
                    </p>
                  </details>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-1 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 shrink-0 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pergunte sobre seus projetos, faturas, prazos..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
