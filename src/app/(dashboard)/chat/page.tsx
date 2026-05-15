'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Search, Send, Phone, Video, Check, CheckCheck, Loader2,
} from 'lucide-react'

export default function ChatPage() {
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(async json => {
        const chData = json.data || []
        setChannels(chData)
        setLoading(false)
        if (chData.length > 0) {
          setSelectedChannel(chData[0].id)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedChannel) return
    const fetchMessages = () => {
      fetch(`/api/messages?channelId=${selectedChannel}`)
        .then(r => r.json())
        .then(json => {
          setMessages(json.data || [])
          setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }, 100)
        })
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [selectedChannel])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChannel || sending) return
    setSending(true)

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newMessage,
        channelId: selectedChannel,
      }),
    })

    if (res.ok) {
      const json = await res.json()
      setMessages(prev => [...prev, json.data])
      setNewMessage('')
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    } else {
      toast.error('Erro ao enviar mensagem')
    }
    setSending(false)
  }

  const selectedChannelData = channels.find(c => c.id === selectedChannel)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-[340px] border-r p-4 space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-9 w-full" />{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[340px] border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Conversas com Clientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 h-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma conversa</p>
            )}
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  selectedChannel === ch.id ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{ch.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ch.name}</p>
                  <p className="text-xs text-muted-foreground">{ch.type === 'project' ? 'Projeto' : 'Direto'}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChannelData ? (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{selectedChannelData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedChannelData.name}</p>
                  <p className="text-xs text-muted-foreground">Chat do projeto</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm"><Video className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef as any}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhuma mensagem ainda</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender?.id === session?.user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%]`}>
                        {!isMine && (
                          <p className="text-2xs text-muted-foreground mb-1 px-1">{msg.sender?.name || 'Cliente'}</p>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-2xs text-muted-foreground">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {isMine && <CheckCheck className="h-3 w-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button size="icon" disabled={!newMessage.trim() || sending} onClick={handleSend}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}
