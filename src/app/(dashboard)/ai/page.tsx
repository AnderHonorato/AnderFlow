'use client'

import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { useAIChat, type AIMessage } from '@/hooks/useAIChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Bot,
  Send,
  Brain,
  StopCircle,
  Trash2,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
} from 'lucide-react'

const SUGGESTIONS = [
  'Como criar um novo projeto?',
  'Quais sao as etapas do fluxo?',
  'Como funciona o briefing?',
  'Como acompanhar o progresso?',
  'Como aprovar um design?',
  'O que faz o modulo financeiro?',
]

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null

  const nodes = useMemo(() => {
    const parts: { type: 'text' | 'code' | 'bold' | 'italic' | 'inlineCode' | 'link' | 'br'; content: string; url?: string }[] = []

    const codeBlockRegex = /```([\s\S]*?)```/g
    let remaining = text
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(remaining)) !== null) {
      const before = remaining.slice(0, match.index)
      const code = match[1]

      if (before) {
        parseInline(before, parts)
      }
      parts.push({ type: 'code', content: code.trim() })
      remaining = remaining.slice(match.index + match[0].length)
      codeBlockRegex.lastIndex = 0
    }

    if (remaining) {
      parseInline(remaining, parts)
    }

    return parts
  }, [text])

  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'code':
            return (
              <pre
                key={i}
                className="my-2 rounded-lg bg-muted/60 p-3 overflow-x-auto text-xs leading-relaxed font-mono"
              >
                <code>{node.content}</code>
              </pre>
            )
          case 'bold':
            return <strong key={i} className="font-semibold">{node.content}</strong>
          case 'italic':
            return <em key={i}>{node.content}</em>
          case 'inlineCode':
            return (
              <code key={i} className="px-1 py-0.5 rounded bg-muted/80 text-xs font-mono">
                {node.content}
              </code>
            )
          case 'link':
            return (
              <a
                key={i}
                href={node.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {node.content}
              </a>
            )
          case 'br':
            return <br key={i} />
          default:
            return <Fragment key={i}>{node.content}</Fragment>
        }
      })}
    </>
  )
}

function parseInline(
  text: string,
  parts: { type: 'text' | 'code' | 'bold' | 'italic' | 'inlineCode' | 'link' | 'br'; content: string; url?: string }[],
) {
  const lines = text.split('\n')
  for (let l = 0; l < lines.length; l++) {
    if (l > 0) parts.push({ type: 'br', content: '\n' })
    let line = lines[l]
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g
    let lastIndex = 0
    let m: RegExpExecArray | null

    while ((m = inlineRegex.exec(line)) !== null) {
      if (m.index > lastIndex) {
        parts.push({ type: 'text', content: line.slice(lastIndex, m.index) })
      }
      const raw = m[0]
      if (raw.startsWith('**') && raw.endsWith('**')) {
        parts.push({ type: 'bold', content: raw.slice(2, -2) })
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        parts.push({ type: 'italic', content: raw.slice(1, -1) })
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        parts.push({ type: 'inlineCode', content: raw.slice(1, -1) })
      } else if (m[1] && m[2]) {
        parts.push({ type: 'link', content: m[1], url: m[2] })
      }
      lastIndex = m.index + raw.length
    }

    if (lastIndex < line.length) {
      parts.push({ type: 'text', content: line.slice(lastIndex) })
    }
  }
}

function ThinkingBubble({
  content,
  isStreaming,
}: {
  content: string
  isStreaming: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [content])

  const previewLines = content.split('\n').filter(Boolean)
  const preview = previewLines.slice(0, 3).join('\n')
  const hasMore = previewLines.length > 3

  return (
    <div className="mb-3 rounded-xl overflow-hidden border border-purple-500/15 bg-purple-500/[0.04] dark:bg-purple-500/[0.06]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-500/[0.06] transition-colors"
      >
        <Brain
          className={cn(
            'h-4 w-4 text-purple-500 shrink-0',
            isStreaming && 'animate-pulse',
          )}
        />
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
          {isStreaming ? 'Pensando...' : 'Pensamento'}
        </span>
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-purple-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
          )}
        </span>
      </button>

      <div className="px-3 pb-2.5">
        {!expanded ? (
          <div className="relative" style={{ maxHeight: '60px', overflow: 'hidden' }}>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/80">
              {preview}
              {isStreaming && <span className="animate-pulse text-purple-500">|</span>}
            </p>
            {hasMore && (
              <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-purple-500/[0.04] dark:from-purple-500/[0.06] to-transparent" />
            )}
          </div>
        ) : (
          <div
            ref={contentRef}
            className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/80 max-h-[240px] overflow-y-auto scrollbar-thin"
          >
            {content}
            {isStreaming && <span className="animate-pulse text-purple-500">|</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingBubbleStatic({
  content,
}: {
  content: string
}) {
  const [expanded, setExpanded] = useState(false)

  const previewLines = content.split('\n').filter(Boolean)
  const preview = previewLines.slice(0, 3).join('\n')
  const hasMore = previewLines.length > 3

  return (
    <div className="mb-2 rounded-xl overflow-hidden border border-purple-500/10 bg-purple-500/[0.03] dark:bg-purple-500/[0.05]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-purple-500/[0.04] transition-colors"
      >
        <Brain className="h-3.5 w-3.5 text-purple-500 shrink-0" />
        <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
          Pensamento
        </span>
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-purple-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-purple-400" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-2.5">
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground/70 max-h-[200px] overflow-y-auto scrollbar-thin">
            {content}
          </div>
        </div>
      )}

      {!expanded && (
        <div className="px-3 pb-2">
          <div className="relative" style={{ maxHeight: '36px', overflow: 'hidden' }}>
            <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground/60 truncate">
              {preview}
            </p>
            {hasMore && (
              <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none bg-gradient-to-t from-purple-500/[0.03] dark:from-purple-500/[0.05] to-transparent" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  const isUser = msg.role === 'user'
  const isAst = msg.role === 'assistant'
  const hasCacheHit = msg.usage && msg.usage.cache_hit_tokens > 0

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {isAst && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={cn('max-w-[80%] min-w-0')}>
        {isAst && msg.reasoning && (
          <ThinkingBubbleStatic content={msg.reasoning} />
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-card border border-border rounded-bl-sm',
          )}
        >
          <MarkdownRenderer text={msg.content} />
        </div>

        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-[10px] text-muted-foreground/50">
            {formatTime(msg.createdAt)}
          </p>
          {hasCacheHit && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-green-600 dark:text-green-400 font-medium">
              <Zap className="h-2.5 w-2.5" />
              Cache
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export default function AIPage() {
  const [input, setInput] = useState('')
  const [useThinking, setUseThinking] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isStreaming,
    isThinking,
    reasoningContent,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
  } = useAIChat()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, reasoningContent, streamingContent, isStreaming])

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isStreaming) return
    setInput('')
    sendMessage(content, useThinking)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border/40">
        <div>
          <h1 className="text-lg font-medium">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">
            Tire duvidas sobre seus projetos e o AnderFlow
          </p>
        </div>
        <button
          onClick={clearMessages}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 scrollbar-thin">
        {messages.length === 0 && !isStreaming && (
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
              {SUGGESTIONS.map((suggestion) => (
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
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[80%] min-w-0">
                {isThinking && reasoningContent && (
                  <ThinkingBubble content={reasoningContent} isStreaming />
                )}
                {streamingContent && (
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-card border border-border">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer text={streamingContent} />
                      <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle rounded-sm" />
                    </div>
                  </div>
                )}
                {!reasoningContent && !streamingContent && (
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-card border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando ao assistente...
                    </div>
                  </div>
                )}
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

      <div className="px-6 py-3 shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Switch
              id="ai-thinking-mode"
              checked={useThinking}
              onCheckedChange={setUseThinking}
              disabled={isStreaming}
            />
            <Label
              htmlFor="ai-thinking-mode"
              className="text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Brain className={cn('h-3.5 w-3.5', useThinking && 'text-purple-500')} />
              Modo Raciocinio
            </Label>
          </div>
          {useThinking && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
              Ativado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Pergunte algo sobre seus projetos... (Ctrl+Enter para enviar)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="flex-1 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 pointer-events-none hidden sm:block">
              Ctrl+Enter
            </span>
          </div>
          {isStreaming ? (
            <Button variant="outline" onClick={stopGeneration} className="gap-2 shrink-0">
              <StopCircle className="h-4 w-4" />
              Parar
            </Button>
          ) : (
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="gap-2 shrink-0"
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
