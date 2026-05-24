'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

const TAG_COLORS = ['#E8622A', '#3D9A6E', '#3A7AC4', '#C4852A', '#8B5CF6']

function hashColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export function TagInput({ tags, onChange, maxTags = 5 }: TagInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(j => setSuggestions(j.data?.tags || [])).catch(() => {})
  }, [])

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase()
    if (!clean || tags.includes(clean) || tags.length >= maxTags) return
    onChange([...tags, clean])
    setInput('')
  }

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
  }

  const filtered = suggestions.filter(s => s.includes(input.toLowerCase()) && !tags.includes(s))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ background: hashColor(tag) }}>
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      {tags.length < maxTags && (
        <div className="relative">
          <Input ref={inputRef} value={input} onChange={e => { setInput(e.target.value); setShowSuggestions(true) }} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Adicionar tag..." className="h-7 text-xs" />
          {showSuggestions && input && filtered.length > 0 && (
            <div className="absolute z-50 top-full left-0 mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-32 overflow-y-auto">
              {filtered.slice(0, 5).map(s => (
                <button key={s} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-hover)]" onMouseDown={e => { e.preventDefault(); addTag(s) }}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
