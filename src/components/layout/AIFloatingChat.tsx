'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAIChat } from '@/hooks/useAIChat'
import {
  Bot,
  Send,
  X,
  Trash2,
  Brain,
  StopCircle,
  Loader2,
  Sparkles,
  ChevronUp,
  User,
} from 'lucide-react'

const SUGGESTIONS = [
  'Como criar um projeto?',
  'Quais as etapas do fluxo?',
  'Como funciona o briefing?',
  'O que faz o financeiro?',
  'Como acompanhar o progresso?',
]

export function AIFloatingChat() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [useReasoning, setUseReasoning] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    error,
    streamingContent,
    streamingReasoning,
    sendMessage,
    clearMessages,
    stopGeneration,
  } = useAIChat()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(
    (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || isLoading) return
      setInput('')
      sendMessage(content, useReasoning ? 'metrys-flash' : 'metrys-pro')
    },
    [input, isLoading, sendMessage, useReasoning],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const userName = session?.user?.name?.split(' ')[0] || 'Usuario'

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            title="Assistente IA"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">IA</span>
          </button>
        </div>
      )}

      <div
        className="fixed bottom-6 right-6 z-50 bg-card border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        style={{
          width: open ? '400px' : '0px',
          height: open ? '560px' : '0px',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '16px',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1)' : 'scale(0.9)',
          transformOrigin: 'bottom right',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Assistente IA</p>
              <p className="text-[10px] text-muted-foreground">AnderFlow</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && !isLoading && (
              <button
                onClick={clearMessages}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
                title="Limpar conversa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
              title="Minimizar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
          {messages.length === 0 && !isLoading && !streamingContent && (
            <div className="flex flex-col items-center text-center gap-3 pt-6">
              <p className="text-sm font-medium">Ola, {userName}!</p>
              <p className="text-xs text-muted-foreground">
                Sou seu assistente IA. Pergunte sobre projetos, fluxos ou qualquer duvida sobre o AnderFlow.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  {msg.reasoning && (
                    <details className="mb-1.5">
                      <summary className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                        <Brain className="h-2.5 w-2.5" />
                        Pensamento
                      </summary>
                      <p className="text-[10px] opacity-60 mt-1 whitespace-pre-wrap border-l-2 border-border pl-1.5">
                        {msg.reasoning}
                      </p>
                    </details>
                  )}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {streamingContent && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-muted">
                  {streamingReasoning && (
                    <details className="mb-1.5" open>
                      <summary className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                        <Brain className="h-2.5 w-2.5 animate-pulse" />
                        Pensando...
                      </summary>
                      <p className="text-[10px] opacity-60 mt-1 whitespace-pre-wrap border-l-2 border-border pl-1.5">
                        {streamingReasoning}
                      </p>
                    </details>
                  )}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-1 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
                  </p>
                </div>
              </div>
            )}

            {isLoading && !streamingContent && !streamingReasoning && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 py-2 shrink-0 border-t border-border bg-card">
          <div className="flex items-center gap-1.5 mb-2">
            <Switch
              checked={useReasoning}
              onCheckedChange={setUseReasoning}
              disabled={isLoading}
            />
            <Label className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Raciocinio
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <textarea
              rows={1}
              placeholder="Pergunte algo..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 100) + 'px'
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 text-xs bg-muted border border-border rounded-xl outline-none resize-none px-3 py-2 placeholder:text-muted-foreground focus:border-primary/30 transition-colors max-h-[100px]"
            />
            {isLoading ? (
              <button
                onClick={stopGeneration}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0"
                title="Parar geracao"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40"
                title="Enviar"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
