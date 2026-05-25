'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  IconSend, IconPaperclip, IconImage, IconTrash,
} from '@/components/icons'

interface Message {
  id: string
  content: string
  senderId: string
  sender?: { id: string; name: string; role: string }
  type: string
  metadata?: string | null
  createdAt: string
  isEdited: boolean
}

interface AdvancedChatProps {
  channelId: string | null
  compact?: boolean
}

function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="text-[11px] bg-[var(--surface-3)] px-1 rounded">$1</code>')
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function AdvancedChat({ channelId, compact = false }: AdvancedChatProps) {
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [uploadPreviews, setUploadPreviews] = useState<{ name: string; size: number; type: string; url: string }[]>([])

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      return
    }

    const fetchMessages = () => {
      fetch(`/api/messages?channelId=${channelId}`)
        .then(r => r.json())
        .then(json => {
          setMessages(json.data || [])
          setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }, 100)
        })
    }
    setMessages([])
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [channelId])

  const handleSend = async () => {
    if ((!newMessage.trim() && uploadPreviews.length === 0) || !channelId || sending) return
    setSending(true)

    try {
      if (newMessage.trim()) {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage, channelId, type: 'text' }),
        })
        if (res.ok) {
          const json = await res.json()
          setMessages(prev => [...prev, json.data])
        }
      }

      for (const preview of uploadPreviews) {
        let finalUrl = preview.url
        const isBlob = preview.url.startsWith('blob:')

        if (isBlob) {
          try {
            const blobResponse = await fetch(preview.url)
            const blob = await blobResponse.blob()
            const file = new File([blob], preview.name, { type: preview.type })
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json()
              finalUrl = uploadJson.url
            }
          } catch (e) {
            console.error('Upload failed:', e)
          }
        }

        const msgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: preview.name,
            channelId,
            type: preview.type.startsWith('image/') ? 'image' : 'file',
            metadata: JSON.stringify({ name: preview.name, size: preview.size, type: preview.type, url: finalUrl }),
          }),
        })
        if (msgRes.ok) {
          const json = await msgRes.json()
          setMessages(prev => [...prev, json.data])
        }
      }

      setNewMessage('')
      setUploadPreviews([])
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    } catch {
      toast.error('Erro ao enviar mensagem')
    }
    setSending(false)
  }

  const handleDelete = async (msgId: string) => {
    const res = await fetch(`/api/messages/${msgId}`, { method: 'DELETE' })
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: 'Mensagem apagada', type: 'deleted', isEdited: true } : m))
      toast.success('Mensagem apagada')
    } else {
      toast.error('Erro ao apagar')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isCorrectType = isImage ? file.type.startsWith('image/') : !file.type.startsWith('image/')
      if (!isCorrectType) continue
      setUploadPreviews(prev => [...prev, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }])
    }
    e.target.value = ''
  }

  const insertFormatting = (wrapper: string) => {
    const textarea = document.querySelector('.chat-input') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    const replacement = selected ? wrapper + selected + wrapper : wrapper + 'texto' + wrapper
    setNewMessage(textarea.value.substring(0, start) + replacement + textarea.value.substring(end))
  }

  const isMine = (senderId: string) => senderId === session?.user?.id

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollRef as any}>
        <div className={`space-y-3 ${compact ? 'max-w-full' : 'max-w-2xl mx-auto'}`}>
          {messages.length === 0 && (
            <p className="text-[12px] text-[var(--text-3)] text-center py-8">Nenhuma mensagem ainda</p>
          )}
          {messages.filter(Boolean).map((msg) => {
            const mine = isMine(msg.senderId || msg.sender?.id || '')
            const meta = msg.metadata ? (() => { try { return JSON.parse(msg.metadata) } catch { return null } })() : null

            return (
              <div
                key={msg.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <p className="text-[10px] text-[var(--text-3)] mb-1 px-2">{msg.sender?.name || 'Usuario'}</p>
                  )}
                  <div className="relative">
                    <div className={`rounded-2xl px-3.5 py-2.5 ${
                      mine ? 'bg-[var(--accent)] text-white rounded-br-md' : 'bg-[var(--surface-2)] rounded-bl-md'
                    } ${msg.type === 'deleted' ? 'italic opacity-50' : ''}`}>
                      {msg.type === 'image' && meta?.url ? (
                        <img
                          src={meta.url}
                          alt={meta.name || 'image'}
                          className="max-h-[200px] rounded-lg cursor-pointer object-cover"
                          onClick={() => setLightboxUrl(meta.url)}
                        />
                      ) : msg.type === 'file' && meta ? (
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v3h3"/></svg>
                          <div className="min-w-0">
                            <p className="text-[12px] truncate font-[500]">{meta.name}</p>
                            <p className="text-[10px] opacity-70">{formatBytes(meta.size)}</p>
                          </div>
                          <a href={meta.url} download className="ml-1 shrink-0 opacity-70 hover:opacity-100" aria-label={`Baixar ${meta.name}`}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v10M4 8l4 4 4-4M2 14h12"/></svg>
                          </a>
                        </div>
                      ) : (
                        <p className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderText(msg.content) }} />
                      )}
                    </div>
                    {mine && hoveredMsg === msg.id && msg.type !== 'deleted' && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="absolute -left-7 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded text-[var(--text-3)] hover:text-[var(--destructive)] opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Excluir mensagem"
                      >
                        <IconTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 px-2 ${mine ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-[var(--text-3)]">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {mine && msg.type !== 'deleted' && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]"><path d="M3 8l3 3 7-7"/></svg>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {uploadPreviews.length > 0 && (
            <div className="flex justify-end">
              <div className="space-y-1.5">
                {uploadPreviews.map((p, i) => (
                  <div key={i} className="rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-3.5 py-2.5 max-w-[75%]">
                    {p.type.startsWith('image/') ? (
                      <Image src={p.url} alt={p.name} width={150} height={150} className="max-h-[150px] w-auto rounded-lg" unoptimized />
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v3h3"/></svg>
                        <span className="text-[12px] truncate max-w-[100px]">{p.name}</span>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setUploadPreviews([])}
                  className="text-[10px] text-[var(--text-3)] hover:text-[var(--text)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {channelId && (
        <div className="border-t p-3">
          <div className={`flex items-center gap-1.5 ${compact ? '' : 'max-w-2xl mx-auto'}`}>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
              aria-label="Selecionar arquivo"
            />
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, true)}
              aria-label="Selecionar imagem"
            />
            <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8" onClick={() => fileInputRef.current?.click()}>
              <IconPaperclip className="w-[14px] h-[14px]" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8" onClick={() => imageInputRef.current?.click()}>
              <IconImage className="w-[14px] h-[14px]" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8 font-[600] text-[12px]" onClick={() => insertFormatting('**')}>B</Button>
            <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8 italic text-[12px]" onClick={() => insertFormatting('_')}>I</Button>
            <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8 text-[12px] font-mono" onClick={() => insertFormatting('`')}>&lt;&gt;</Button>
            <textarea
              placeholder="Mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="chat-input flex-1 h-9 min-h-[36px] max-h-[120px] resize-none rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button size="icon-sm" onClick={handleSend} disabled={(!newMessage.trim() && uploadPreviews.length === 0) || sending} className="shrink-0 h-8 w-8">
              {sending ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M8 2a6 6 0 016 6"/></svg>
              ) : (
                <IconSend className="w-[14px] h-[14px]" />
              )}
            </Button>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent border-0 shadow-none" onClick={() => setLightboxUrl(null)}>
            <div className="relative w-full h-[85vh]">
              <Image src={lightboxUrl} alt="Preview" fill className="object-contain rounded-lg" sizes="90vw" unoptimized />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
