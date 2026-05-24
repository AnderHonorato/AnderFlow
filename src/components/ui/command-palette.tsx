'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, FolderKanban, Users, TicketIcon, ArrowRight } from 'lucide-react'

interface SearchResult {
  projects: { id: string; name: string; client?: { name: string } }[]
  clients: { id: string; name: string; email: string; company?: string }[]
  tickets: { id: string; title: string; creator?: { name: string } }[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allItems = results
    ? [
        ...results.projects.map((p) => ({ type: 'project' as const, id: p.id, label: p.name, sub: p.client?.name || '', href: `/projects/${p.id}` })),
        ...results.clients.map((c) => ({ type: 'client' as const, id: c.id, label: c.name, sub: c.company || c.email, href: `/clients/${c.id}` })),
        ...results.tickets.map((t) => ({ type: 'ticket' as const, id: t.id, label: t.title, sub: t.creator?.name || '', href: `/tickets/${t.id}` })),
      ]
    : []

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(null)
      setSelectedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
        return
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && allItems[selectedIndex]) {
        e.preventDefault()
        router.push(allItems[selectedIndex].href)
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, selectedIndex, allItems, onClose, router])

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.data || null)
      } catch {
        setResults(null)
      }
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (!open) return null

  const sections = results
    ? [
        { label: 'Projetos', items: results.projects, icon: FolderKanban, href: (id: string) => `/projects/${id}` },
        { label: 'Clientes', items: results.clients, icon: Users, href: (id: string) => `/clients/${id}` },
        { label: 'Tickets', items: results.tickets, icon: TicketIcon, href: (id: string) => `/tickets/${id}` },
      ]
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-[560px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-scale-in"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--text-3)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1) }}
            placeholder="Buscar projetos, clientes, tickets..."
            className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
          />
          {loading && (
            <div className="h-4 w-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          )}
        </div>

        {results && (
          <ScrollArea className="max-h-[360px]">
            {sections.map((section) =>
              section.items.length > 0 ? (
                <div key={section.label}>
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                      {section.label}
                    </p>
                  </div>
                  {section.items.map((item: any) => {
                    const idx = allItems.findIndex((i) => i.id === item.id && i.type === section.label.toLowerCase().replace(/s$/, ''))
                    return (
                      <button
                        key={item.id}
                        onClick={() => { router.push((section as any).href(item.id)); onClose() }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          idx === selectedIndex
                            ? 'bg-[var(--surface-2)]'
                            : 'hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <section.icon className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-[500] text-[var(--text)] truncate">
                            {item.name || item.title}
                          </p>
                          {item.client?.name && (
                            <p className="text-[11px] text-[var(--text-3)] truncate">{item.client.name}</p>
                          )}
                          {item.email && (
                            <p className="text-[11px] text-[var(--text-3)] truncate">{item.email}</p>
                          )}
                          {item.creator?.name && (
                            <p className="text-[11px] text-[var(--text-3)] truncate">{item.creator.name}</p>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-[var(--text-3)] shrink-0" />
                      </button>
                    )
                  })}
                </div>
              ) : null
            )}
            {allItems.length === 0 && !loading && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--text-3)]">Nenhum resultado encontrado</p>
              </div>
            )}
          </ScrollArea>
        )}

        {!results && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--text-3)]">
              {loading ? 'Buscando...' : 'Digite para buscar projetos, clientes e tickets'}
            </p>
          </div>
        )}

        {results && allItems.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-3)]">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-mono">↑↓</kbd> navegar{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-mono">Enter</kbd> abrir{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[10px] font-mono">Esc</kbd> fechar
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
