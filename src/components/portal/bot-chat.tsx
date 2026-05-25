'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'


const SUGGESTIONS = ['Status dos meus projetos', 'Ver faturas pendentes', 'Criar um ticket']

export function BotChat() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const name = session?.user?.name?.split(' ')[0] || 'Cliente'
      setMessages([{ role: 'assistant', content: `Olá ${name}! Como posso te ajudar hoje?` }])
    }
  }, [open, messages.length, session])

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const newMsgs = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/chat-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      })
      const json = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: json.data?.reply || 'Desculpe, não consegui responder.' }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar.' }]) }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-hover)] transition-all hover:scale-105" aria-label="Abrir chat">
      <MessageCircle className="h-6 w-6" />
    </button>
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[480px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--accent-subtle)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text)]">Assistente ANDERFLOW</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-md' : 'bg-[var(--surface-2)] rounded-bl-md'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-[var(--surface-2)] rounded-2xl rounded-bl-md px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-hover)] transition-colors">{s}</button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-[var(--border)] flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(input) }} placeholder="Digite sua mensagem..." className="h-8 text-xs" />
        <Button size="sm" disabled={!input.trim() || loading} onClick={() => send(input)}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
