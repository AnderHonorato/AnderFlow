'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface FeatureFeedbackProps {
  page: string
}

export function FeatureFeedback({ page }: FeatureFeedbackProps) {
  const [voted, setVoted] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      const storage = JSON.parse(localStorage.getItem('ui_feedback_votes') || '{}')
      if (storage[page]) {
        const voteDate = new Date(storage[page].date)
        if (Date.now() - voteDate.getTime() < 7 * 86400000) {
          setVoted(storage[page].helpful)
        }
      }
    } catch {}
  }, [page])

  const handleVote = async (helpful: boolean) => {
    setSubmitting(true)
    try {
      await fetch('/api/ui-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, helpful }),
      })
      setVoted(helpful)
      try {
        const storage = JSON.parse(localStorage.getItem('ui_feedback_votes') || '{}')
        storage[page] = { helpful, date: new Date().toISOString() }
        localStorage.setItem('ui_feedback_votes', JSON.stringify(storage))
      } catch {}
      setTimeout(() => setVoted(null), 3000)
    } catch {}
    setSubmitting(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {typeof voted === 'boolean' ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[11px] text-[var(--text-2)] shadow-lg animate-fade-in">
          Obrigado pelo feedback!
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-3)]">Esta pagina foi util?</span>
          <button
            onClick={() => handleVote(true)}
            disabled={submitting}
            className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-3)] hover:text-[var(--success)]"
            title="Sim"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={submitting}
            className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-3)] hover:text-[var(--destructive)]"
            title="Nao"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
