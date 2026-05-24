'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

interface FaqItem {
  question: string
  answer: string
}

export function FaqWidget() {
  const router = useRouter()
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/portal/faq')
      .then(r => r.json())
      .then(json => setFaqs(json.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = faqs.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Perguntas Frequentes</h3>
        {loading && <Skeleton className="h-4 w-20" />}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-3)]" />
        <Input
          placeholder="Buscar nas FAQs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filtered.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="rounded-lg border border-[var(--border)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className="text-xs font-medium text-[var(--text)] pr-2">{faq.question}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--text-3)] transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === i && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-[var(--text-2)] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && !loading && (
            <p className="text-xs text-[var(--text-3)] text-center py-3">Nenhuma FAQ encontrada</p>
          )}
        </div>
      )}

      <button
        onClick={() => router.push('/portal/tickets/new')}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
      >
        Nao encontrou sua resposta? Abrir ticket <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  )
}
