'use client'

import { useEffect, useState, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { MessageSquare, MoreHorizontal, ThumbsUp, Reply, Send, AtSign } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { sanitize } from '@/lib/utils/sanitize'

interface Comment {
  id: string
  content: string
  user: { name: string; image?: string; role?: string }
  createdAt: string
  replies?: Comment[]
}

interface CommentThreadProps {
  comments: Comment[]
  onAddComment: (content: string, parentId?: string) => void
  className?: string
}

function renderCommentContent(content: string): React.ReactNode {
  if (content.includes('<') && content.includes('>')) {
    const basicSanitize = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript\s*:/gi, '')
    return <div dangerouslySetInnerHTML={{ __html: basicSanitize }} className="whitespace-pre-wrap [&_a]:text-[var(--accent)] [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_pre]:bg-[var(--surface-2)] [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:text-[11px] [&_code]:bg-[var(--surface-2)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]" />
  }
  return renderMarkdown(content)
}

function renderMarkdown(text: string): React.ReactNode {
  const parts: { type: 'text' | 'code' | 'bold' | 'italic' | 'inlineCode' | 'mention'; content: string; lang?: string; role?: string; key: number }[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const matches: { type: 'code' | 'bold' | 'italic' | 'inlineCode' | 'mention'; idx: number; match: RegExpMatchArray }[] = []

    const codeMatch = remaining.match(/```(\w*)\n?([\s\S]+?)```/)
    if (codeMatch && codeMatch.index !== undefined) matches.push({ type: 'code', idx: codeMatch.index, match: codeMatch })

    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) matches.push({ type: 'bold', idx: boldMatch.index, match: boldMatch })

    const italicMatch = remaining.match(/_(.+?)_/)
    if (italicMatch && italicMatch.index !== undefined) matches.push({ type: 'italic', idx: italicMatch.index, match: italicMatch })

    const inlineCodeMatch = remaining.match(/`(.+?)`/)
    if (inlineCodeMatch && inlineCodeMatch.index !== undefined) matches.push({ type: 'inlineCode', idx: inlineCodeMatch.index, match: inlineCodeMatch })

    const mentionMatch = remaining.match(/@(\w+(?:\s\w+)?)/)
    if (mentionMatch && mentionMatch.index !== undefined) matches.push({ type: 'mention', idx: mentionMatch.index, match: mentionMatch })

    const earliest = matches.length > 0 ? matches.reduce((a, b) => (a.idx < b.idx ? a : b)) : null

    if (!earliest) {
      parts.push({ type: 'text', content: remaining, key: key++ })
      break
    }

    if (earliest.idx > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, earliest.idx), key: key++ })
    }

    if (earliest.type === 'code') {
      parts.push({ type: 'code', content: earliest.match[2], lang: earliest.match[1] || 'text', key: key++ })
      remaining = remaining.slice(earliest.idx + earliest.match[0].length)
    } else if (earliest.type === 'bold') {
      parts.push({ type: 'bold', content: earliest.match[1], key: key++ })
      remaining = remaining.slice(earliest.idx + earliest.match[0].length)
    } else if (earliest.type === 'italic') {
      parts.push({ type: 'italic', content: earliest.match[1], key: key++ })
      remaining = remaining.slice(earliest.idx + earliest.match[0].length)
    } else if (earliest.type === 'inlineCode') {
      parts.push({ type: 'inlineCode', content: earliest.match[1], key: key++ })
      remaining = remaining.slice(earliest.idx + earliest.match[0].length)
    } else if (earliest.type === 'mention') {
      parts.push({ type: 'mention', content: earliest.match[1], key: key++ })
      remaining = remaining.slice(earliest.idx + earliest.match[0].length)
    }
  }

  return (
    <>
      {parts.map(part => {
        if (part.type === 'code') return (
          <div key={part.key} className="relative my-2 rounded-lg overflow-hidden border border-[var(--border)]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-2)]">
              <span className="text-[10px] text-[var(--text-3)] uppercase">{part.lang}</span>
            </div>
            <SyntaxHighlighter language={part.lang} style={vscDarkPlus} customStyle={{ borderRadius: '0 0 8px 8px', fontSize: '11px', maxHeight: '300px', margin: 0 }}>
              {part.content}
            </SyntaxHighlighter>
          </div>
        )
        if (part.type === 'bold') return <strong key={part.key} className="font-semibold">{part.content}</strong>
        if (part.type === 'italic') return <em key={part.key}>{part.content}</em>
        if (part.type === 'inlineCode') return <code key={part.key} className="px-1 py-0.5 rounded bg-[var(--surface-2)] text-[11px] font-mono">{part.content}</code>
        if (part.type === 'mention') return <span key={part.key} className="text-[var(--info)] font-medium cursor-pointer hover:underline">@{part.content}</span>
        return <span key={part.key} className="whitespace-pre-wrap">{part.content}</span>
      })}
    </>
  )
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (parentId: string) => void }) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarFallback className="text-xs">{getInitials(comment.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="text-sm font-medium">{comment.user.name}</p>
            <div className="text-sm mt-0.5">{renderCommentContent(comment.content)}</div>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Curtir</button>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => onReply(comment.id)}><Reply className="h-3 w-3" /> Responder</button>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11">
          <button className="text-xs text-primary hover:underline" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Ocultar' : `Ver ${comment.replies.length} respostas`}
          </button>
          {showReplies && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <Avatar className="h-6 w-6 mt-0.5"><AvatarFallback className="text-2xs">{getInitials(reply.user.name)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted px-3 py-1.5">
                      <p className="text-sm font-medium">{reply.user.name}</p>
                      <div className="text-sm">{renderCommentContent(reply.content)}</div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 px-1">{formatRelativeTime(reply.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CommentThread({ comments, onAddComment, className }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionUsers, setMentionUsers] = useState<any[]>([])
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedMention = useDebounce(mentionFilter, 300)

  useEffect(() => {
    if (!debouncedMention) { setMentionUsers([]); return }
    fetch(`/api/users?active=true&q=${encodeURIComponent(debouncedMention)}`)
      .then(r => r.json())
      .then(json => setMentionUsers((json.data || []).slice(0, 5)))
      .catch(() => setMentionUsers([]))
  }, [debouncedMention])

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewComment(val)

    const cursorPos = (e.target as HTMLInputElement).selectionStart || 0
    const beforeCursor = val.slice(0, cursorPos)
    const atMatch = beforeCursor.match(/@(\w*)$/)

    if (atMatch) {
      setMentionFilter(atMatch[1])
      setShowMentionDropdown(true)
      const rect = inputRef.current?.getBoundingClientRect()
      if (rect) setMentionPos({ top: rect.top - 200, left: rect.left })
    } else {
      setShowMentionDropdown(false)
    }
  }

  const handleMentionSelect = (user: any) => {
    const cursorPos = inputRef.current?.selectionStart || 0
    const beforeCursor = newComment.slice(0, cursorPos)
    const afterCursor = newComment.slice(cursorPos)
    const atIdx = beforeCursor.lastIndexOf('@')
    const newText = beforeCursor.slice(0, atIdx) + '@' + user.name + ' ' + afterCursor
    setNewComment(newText)
    setShowMentionDropdown(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const plainText = newComment.replace(/<[^>]*>/g, '')
    onAddComment(plainText || newComment, replyTo || undefined)
    setNewComment('')
    if (replyTo) setReplyTo(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onReply={(id) => setReplyTo(id)} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        <Avatar className="h-8 w-8 mt-1"><AvatarFallback className="text-xs">VC</AvatarFallback></Avatar>
        <div className="flex-1 space-y-2">
          {replyTo && (
            <div className="text-xs text-muted-foreground">
              Respondendo... <button className="text-primary hover:underline" onClick={() => setReplyTo(null)}>Cancelar</button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <RichTextEditor
              value={newComment}
              onChange={setNewComment}
              placeholder={replyTo ? "Escreva sua resposta... (@ para mencionar)" : "Adicione um comentario... (@ para mencionar)"}
              className="flex-1"
              onSubmit={() => {
                if (newComment.trim()) {
                  const plainText = newComment.replace(/<[^>]*>/g, '')
                  onAddComment(plainText || newComment, replyTo || undefined)
                  setNewComment('')
                  if (replyTo) setReplyTo(null)
                }
              }}
            />
            <Button type="submit" size="sm" disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
