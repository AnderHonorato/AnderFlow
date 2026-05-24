'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { sanitize } from '@/lib/utils/sanitize'
import {
  Bold, Italic, Underline, List, Link, Code, AlignLeft,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  onSubmit?: () => void
}

export function RichTextEditor({ value, onChange, placeholder, className, onSubmit }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const handleExec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val || '')
    editorRef.current?.focus()
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleBold = () => handleExec('bold')
  const handleItalic = () => handleExec('italic')
  const handleUnderline = () => handleExec('underline')
  const handleInsertUnorderedList = () => handleExec('insertUnorderedList')
  const handleCode = () => handleExec('formatBlock', '<pre>')

  const handleLink = () => {
    if (showLinkInput) {
      if (linkUrl.trim()) {
        handleExec('createLink', linkUrl.trim())
      }
      setLinkUrl('')
      setShowLinkInput(false)
    } else {
      setShowLinkInput(true)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const safe = sanitize.text(text)
    document.execCommand('insertText', false, safe)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-0.5 p-1 border border-[var(--border)] border-b-0 rounded-t-lg bg-[var(--surface-2)]">
        <Button variant="ghost" size="icon-sm" onClick={handleBold} title="Negrito" aria-label="Negrito" className="h-7 w-7">
          <Bold className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleItalic} title="Italico" aria-label="Italico" className="h-7 w-7">
          <Italic className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleUnderline} title="Sublinhado" aria-label="Sublinhado" className="h-7 w-7">
          <Underline className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
        <Button variant="ghost" size="icon-sm" onClick={handleInsertUnorderedList} title="Lista" aria-label="Lista" className="h-7 w-7">
          <List className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleCode} title="Codigo" aria-label="Codigo" className="h-7 w-7">
          <Code className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleLink} title="Link" aria-label="Link" className="h-7 w-7">
          <Link className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        {showLinkInput && (
          <div className="flex items-center gap-1 px-1">
            <input
              className="h-6 w-32 text-[11px] rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 focus:outline-none focus:border-[var(--accent)]"
              placeholder="URL..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleLink() }}
            />
          </div>
        )}
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
        <Button variant="ghost" size="icon-sm" onClick={() => handleExec('removeFormat')} title="Limpar formatacao" aria-label="Limpar formatacao" className="h-7 w-7">
          <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        className="min-h-[60px] max-h-[200px] overflow-y-auto rounded-b-lg border border-t-0 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
        data-placeholder={placeholder || 'Escreva algo...'}
        onPaste={handlePaste}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-3);
          opacity: 0.6;
          pointer-events: none;
        }
        [contenteditable] pre {
          background: var(--surface-2);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
        }
        [contenteditable] a {
          color: var(--accent);
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
