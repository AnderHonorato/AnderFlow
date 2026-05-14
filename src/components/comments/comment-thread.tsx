'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { MessageSquare, MoreHorizontal, ThumbsUp, Reply, Send } from 'lucide-react'

interface Comment {
  id: string
  content: string
  user: { name: string; image?: string }
  createdAt: string
  replies?: Comment[]
}

interface CommentThreadProps {
  comments: Comment[]
  onAddComment: (content: string, parentId?: string) => void
  className?: string
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment
  onReply: (parentId: string) => void
}) {
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
            <p className="text-sm mt-0.5">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" /> Curtir
            </button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-3 w-3" /> Responder
            </button>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11">
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Ocultar' : `Ver ${comment.replies.length} respostas`}
          </button>
          {showReplies && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <Avatar className="h-6 w-6 mt-0.5">
                    <AvatarFallback className="text-2xs">{getInitials(reply.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted px-3 py-1.5">
                      <p className="text-sm font-medium">{reply.user.name}</p>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5 px-1">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
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
  const [replyText, setReplyText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    onAddComment(newComment, replyTo || undefined)
    setNewComment('')
    if (replyTo) {
      setReplyTo(null)
      setReplyText('')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(id) => {
              setReplyTo(id)
            }}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-start gap-3">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="text-xs">VC</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {replyTo && (
            <div className="text-xs text-muted-foreground">
              Respondendo... {' '}
              <button className="text-primary hover:underline" onClick={() => setReplyTo(null)}>
                Cancelar
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
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
