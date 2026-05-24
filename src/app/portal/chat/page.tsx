'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Loader2 } from 'lucide-react'

export default function PortalChat() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [channelId, setChannelId] = useState<string | null>(null)

  const loadMessages = () => {
    const params = channelId ? `?channelId=${channelId}` : ''
    fetch(`/api/messages${params}`)
      .then(r => r.json())
      .then(json => {
        setMessages(json.data || [])
        setLoading(false)
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(json => {
        const channels = json.data || []
        if (channels.length > 0) {
          setChannelId(channels[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (channelId) loadMessages()
  }, [channelId])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text,
        channelId,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      setMessages(prev => [...prev, json.data])
      setText('')
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100)
    }
    setSending(false)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>

  const isMe = (msg: any) => msg.sender?.role === 'CLIENT' || msg.sender?.role === 'USER' || msg.sender?.role === 'GUEST' || !msg.sender?.role

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-6 border-b">
        <h2 className="text-lg font-medium">Mensagens</h2>
        <p className="text-sm text-muted-foreground mt-1">Chat com o desenvolvedor</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef as any}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhuma mensagem ainda. Envie a primeira!
            </p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%]">
                {!isMe(msg) && <p className="text-2xs text-muted-foreground mb-1 px-1">{msg.sender?.name || 'Dev'}</p>}
                <div className={`rounded-2xl px-4 py-2.5 ${isMe(msg) ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className={`text-2xs text-muted-foreground mt-1 block ${isMe(msg) ? 'text-right' : ''}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-6 py-4">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            placeholder="Digite sua mensagem..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 h-10"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <Button size="icon" disabled={!text.trim() || sending} onClick={send}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
