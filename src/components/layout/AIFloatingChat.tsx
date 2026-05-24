'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAIChat } from '@/hooks/useAIChat'
import { cn } from '@/lib/utils'
import {
  Bot,
  Send,
  X,
  Trash2,
  Brain,
  StopCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  HelpCircle,
  GitBranch,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SUGGESTIONS = [
  { text: 'Como criar um projeto?', icon: HelpCircle },
  { text: 'Quais as etapas do fluxo?', icon: GitBranch },
  { text: 'Como funciona o briefing?', icon: FileText },
  { text: 'O que faz o financeiro?', icon: DollarSign },
  { text: 'Como acompanhar o progresso?', icon: TrendingUp },
]

function ReasoningCard({
  reasoning,
  streaming,
  expanded,
  onToggleExpand,
}: {
  reasoning: string
  streaming?: boolean
  expanded: boolean
  onToggleExpand: () => void
}) {
  const frases = reasoning
    .replace(/([.!?])\s+/g, '$1__SPLIT__')
    .replace(/\n+/g, '\n__SPLIT__')
    .split('__SPLIT__')
    .map(f => f.trim())
    .filter(Boolean)

  return (
    <div className={cn(
      'relative rounded-lg overflow-hidden',
      streaming
        ? 'bg-[var(--surface-2)] border-l-2 border-[var(--accent)]/40'
        : 'bg-[var(--surface-2)] border-l-2 border-[var(--accent)]/20'
    )}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Brain className={cn(
            'h-3.5 w-3.5 text-[var(--accent)]',
            streaming && 'animate-pulse'
          )} />
          <span className="text-[12px] font-[500] text-[var(--text)]">
            {streaming ? 'Pensando...' : 'Raciocinio'}
          </span>
        </div>
        {!streaming && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            {expanded ? 'Recolher' : 'Ver completo'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(!streaming || true) && (
          <motion.div
            initial={streaming ? false : expanded ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={expanded || streaming ? { height: 'auto', opacity: 1 } : { height: streaming ? 120 : 0, opacity: streaming ? 1 : 0 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(
              'px-3 pb-2',
              streaming && 'max-h-[120px] overflow-y-auto scrollbar-thin'
            )}>
              <AnimatePresence mode="popLayout">
                {frases.map((frase, i) => (
                  <motion.p
                    key={`${i}-${frase.slice(0, 20)}`}
                    initial={streaming ? { opacity: 0, y: 4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[12px] leading-relaxed text-[var(--text-2)] whitespace-pre-wrap"
                  >
                    {frase}
                  </motion.p>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AIFloatingChat() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [useReasoning, setUseReasoning] = useState(false)
  const [expandedReasonings, setExpandedReasonings] = useState<Set<string>>(new Set())
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
  }, [messages, streamingContent, streamingReasoning])

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

  const toggleReasoningExpand = (id: string) => {
    setExpandedReasonings(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const userName = session?.user?.name?.split(' ')[0] || 'voce'

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 h-12 px-4 rounded-full bg-[var(--accent)] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            title="Assistente IA"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">IA</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden"
            style={{
              width: '400px',
              height: '560px',
              maxHeight: 'calc(100vh - 40px)',
              borderRadius: '16px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              transformOrigin: 'bottom right',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Assistente IA</p>
                  <p className="text-[10px] text-[var(--text-3)]">AnderFlow</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && !isLoading && (
                  <button
                    onClick={clearMessages}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)]"
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)]"
                  title="Minimizar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
              {messages.length === 0 && !isLoading && !streamingContent && (
                <div className="flex flex-col items-center text-center gap-3 pt-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                    <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">Ola, {userName}!</p>
                    <p className="text-xs text-[var(--text-3)] mt-1">
                      Sou seu assistente IA. Pergunte sobre projetos, fluxos ou qualquer duvida sobre o AnderFlow.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full mt-1">
                    {SUGGESTIONS.map((s) => {
                      const Icon = s.icon
                      return (
                        <button
                          key={s.text}
                          onClick={() => handleSend(s.text)}
                          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 bg-[var(--surface-2)] hover:bg-[var(--accent-subtle)] text-left transition-all duration-200 group"
                        >
                          <Icon className="h-3.5 w-3.5 text-[var(--text-3)] group-hover:text-[var(--accent)] shrink-0 mt-0.5 transition-colors" />
                          <span className="text-[12px] text-[var(--text-2)] group-hover:text-[var(--text)] transition-colors">
                            {s.text}
                          </span>
                        </button>
                      )
                    })}
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
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                        <Bot className="h-3 w-3 text-[var(--accent)]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent)] text-white rounded-br-sm'
                          : 'bg-[var(--surface-2)] rounded-bl-sm'
                      }`}
                    >
                      {msg.reasoning && (
                        <ReasoningCard
                          reasoning={msg.reasoning}
                          expanded={expandedReasonings.has(msg.id)}
                          onToggleExpand={() => toggleReasoningExpand(msg.id)}
                        />
                      )}
                      <p className={cn(
                        'text-xs whitespace-pre-wrap leading-relaxed',
                        msg.role === 'user' ? 'text-white' : 'text-[var(--text)]'
                      )}>
                        {msg.content}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]">
                        <User className="h-3 w-3 text-[var(--text-3)]" />
                      </div>
                    )}
                  </div>
                ))}

                {streamingContent && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                      <Bot className="h-3 w-3 text-[var(--accent)]" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-[var(--surface-2)]">
                      {streamingReasoning && (
                        <div className="mb-2">
                          <ReasoningCard
                            reasoning={streamingReasoning}
                            streaming
                            expanded={true}
                            onToggleExpand={() => {}}
                          />
                        </div>
                      )}
                      <p className="text-xs whitespace-pre-wrap leading-relaxed text-[var(--text)]">
                        {streamingContent}
                        <span className="inline-block w-1 h-3.5 bg-[var(--accent)] animate-pulse ml-0.5 align-middle" />
                      </p>
                    </div>
                  </div>
                )}

                {isLoading && !streamingContent && !streamingReasoning && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                      <Bot className="h-3 w-3 text-[var(--accent)]" />
                    </div>
                    <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-[var(--surface-2)]">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--text-3)]" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-[var(--destructive)] bg-[var(--destructive-subtle)] rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="px-3 py-2 shrink-0 border-t border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Switch
                  checked={useReasoning}
                  onCheckedChange={setUseReasoning}
                  disabled={isLoading}
                />
                <Label className="text-[10px] text-[var(--text-3)] cursor-pointer flex items-center gap-1">
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
                  className="flex-1 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none resize-none px-3 py-2 placeholder:text-[var(--text-3)] focus:border-[var(--accent)]/30 transition-colors max-h-[100px] text-[var(--text)]"
                />
                {isLoading ? (
                  <button
                    onClick={stopGeneration}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--destructive-subtle)] text-[var(--destructive)] hover:bg-[var(--destructive)]/20 transition-colors shrink-0"
                    title="Parar geracao"
                  >
                    <StopCircle className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors shrink-0 disabled:opacity-40"
                    title="Enviar"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
