'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Search, Send, Phone, Video, Check, CheckCheck, Loader2, Copy, Code, X,
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ChatPage() {
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const lastTypingRef = useRef(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((q: string) => {
    if (!q.trim() || !selectedChannel) { setSearchResults([]); return }
    setSearching(true)
    fetch(`/api/messages/search?q=${encodeURIComponent(q)}&channelId=${selectedChannel}`)
      .then(r => r.json())
      .then(json => { setSearchResults(json.data?.results || []); setSearching(false) })
      .catch(() => setSearching(false))
  }, [selectedChannel])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => handleSearch(val), 500)
  }

  const handleSearchResultClick = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.background = 'var(--accent-subtle)'
      el.style.transition = 'background 0.3s'
      setTimeout(() => { el.style.background = '' }, 3000)
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }
  }

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

  // ── Typing polling ──
  useEffect(() => {
    if (!selectedChannel) return
    const checkTyping = () => {
      fetch(`/api/typing?channelId=${selectedChannel}`)
        .then(r => r.json())
        .then(json => {
          setIsOtherTyping(json.data?.typing || false)
        })
        .catch(() => {})
    }
    checkTyping()
    const interval = setInterval(checkTyping, 2000)
    return () => clearInterval(interval)
  }, [selectedChannel])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    const now = Date.now()
    if (now - lastTypingRef.current > 2000 && selectedChannel) {
      lastTypingRef.current = now
      fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannel }),
      }).catch(() => {})
    }
  }

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

  const [copiedBlock, setCopiedBlock] = useState('')

  const renderMessageContent = (text: string) => {
    const parts: { type: 'text' | 'code'; content: string; lang?: string; key: string }[] = []
    const regex = /```(\w*)\n?([\s\S]+?)```/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index), key: `t-${lastIndex}` })
      }
      parts.push({ type: 'code', content: match[2], lang: match[1] || 'text', key: `c-${match.index}` })
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex), key: `t-${lastIndex}` })
    }
    if (parts.length === 0) return <p className="text-sm leading-relaxed">{text}</p>
    return (
      <>
        {parts.map(part =>
          part.type === 'text'
            ? <span key={part.key} className="text-sm leading-relaxed whitespace-pre-wrap">{part.content}</span>
            : (
              <div key={part.key} className="relative my-2 rounded-lg overflow-hidden border border-[var(--border)]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-2)]">
                  <span className="text-[10px] text-[var(--text-3)] uppercase">{part.lang}</span>
                  <button
                    className="flex items-center gap-1 text-[10px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(part.content)
                      setCopiedBlock(part.key)
                      setTimeout(() => setCopiedBlock(''), 2000)
                    }}
                  >
                    {copiedBlock === part.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedBlock === part.key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <SyntaxHighlighter language={part.lang} style={vscDarkPlus} customStyle={{ borderRadius: '0 0 8px 8px', fontSize: '12px', maxHeight: '400px', margin: 0 }}>
                  {part.content}
                </SyntaxHighlighter>
              </div>
            )
        )}
      </>
    )
  }

  const handleInsertCodeBlock = () => {
    setNewMessage(prev => prev + '\n```\ncole o código aqui\n```\n')
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
                <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(prev => !prev)} title="Buscar mensagens">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm"><Video className="h-4 w-4" /></Button>
              </div>
            </div>

            {searchOpen && (
              <div className="px-6 py-2 border-b bg-[var(--surface-2)]">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-[var(--text-3)]" />
                  <Input
                    placeholder="Buscar mensagens..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1">
                    {searchResults.map((msg: any) => (
                      <button
                        key={msg.id}
                        className="w-full text-left p-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors"
                        onClick={() => handleSearchResultClick(msg.id)}
                      >
                        <p className="text-xs font-medium text-[var(--text)]">{msg.sender?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--text-3)] truncate">{(msg.content || '').slice(0, 80)}</p>
                        <p className="text-2xs text-[var(--text-3)] mt-0.5">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && !searching && searchResults.length === 0 && (
                  <p className="text-xs text-[var(--text-3)] py-2 text-center">Nenhum resultado</p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhuma mensagem ainda</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender?.id === session?.user?.id
                  return (
                    <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%]`}>
                        {!isMine && (
                          <p className="text-2xs text-muted-foreground mb-1 px-1">{msg.sender?.name || 'Cliente'}</p>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                          {renderMessageContent(msg.content)}
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
                {isOtherTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--surface-2)] rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-accent" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-accent" style={{ animationDelay: '300ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-accent" style={{ animationDelay: '600ms' }} />
                      </span>
                      <span className="text-[11px] text-[var(--text-3)] ml-1">digitando...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Button variant="ghost" size="icon-sm" onClick={handleInsertCodeBlock} title="Inserir bloco de código">
                  <Code className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={handleInputChange}
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
