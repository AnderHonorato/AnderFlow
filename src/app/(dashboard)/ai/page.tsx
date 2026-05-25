'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAIChat } from '@/hooks/useAIChat'
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  StopCircle,
  Trash2,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const QUICK_SUGGESTIONS = [
  'Como criar um novo projeto?',
  'Quais são as etapas do fluxo?',
  'Como funciona o briefing?',
  'Como acompanhar o progresso?',
  'Como aprovar um design?',
  'O que faz o módulo financeiro?',
]

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AIPage() {
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
  } = useAIChat({
    onError: () => {},
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, isLoading])

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return
    setInput('')
    sendMessage(content, useReasoning ? 'metrys-flash' : 'metrys-pro')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <h1 className="text-lg font-medium">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">
            Tire duvidas sobre seus projetos e o AnderFlow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="reasoning-toggle"
              checked={useReasoning}
              onCheckedChange={setUseReasoning}
              disabled={isLoading}
            />
            <Label htmlFor="reasoning-toggle" className="text-xs cursor-pointer flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Raciocinio profundo
            </Label>
          </div>
          <Badge variant={isLoading ? 'warning' : 'info'} className="gap-1">
            <Sparkles className="h-3 w-3" />
            {isLoading ? 'Gerando...' : useReasoning ? 'DeepSeek Reasoner' : 'DeepSeek Chat'}
          </Badge>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 scrollbar-thin"
      >
        {messages.length === 0 && !isLoading && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-medium">Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Pergunte sobre projetos, fluxos do AnderFlow, briefings, prazos ou qualquer duvida sobre a plataforma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border rounded-bl-sm'
                }`}
              >
                {msg.reasoning && (
                  <details className="mb-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
                      <Brain className="h-3 w-3" />
                      Pensamento
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap border-l-2 border-muted-foreground/20 pl-2">
                      {msg.reasoning}
                    </p>
                  </details>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                <p className="text-[10px] opacity-50 mt-1">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-card border border-border">
                {streamingReasoning && (
                  <details className="mb-2" open>
                    <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
                      <Brain className="h-3 w-3 animate-pulse" />
                      Pensando...
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap border-l-2 border-muted-foreground/20 pl-2">
                      {streamingReasoning}
                    </p>
                  </details>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
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

      <div className="px-6 py-3 shrink-0 border-t border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pergunte algo sobre seus projetos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button variant="outline" onClick={stopGeneration} className="gap-2">
              <StopCircle className="h-4 w-4" />
              Parar
            </Button>
          ) : (
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          )}
          {messages.length > 0 && !isLoading && (
            <Button variant="ghost" size="icon" onClick={clearMessages} title="Limpar conversa">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
