"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { XCircle, Copy, Wand2, Pencil, Save, X, GitCompare, Eye } from 'lucide-react'
import type { Tab, FileContent, Diagnostic } from './ide-types'
import { getIDEHeaders } from '@/lib/ide-workspace'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'

interface IDEEditorProps {
  openFiles: Tab[]
  activeTabId: string | null
  activeFile: FileContent | null
  diagnostics: Diagnostic[]
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onSendToChat: (content: string) => void
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
  gitDiffBefore?: string
  gitDiffAfter?: string
  onAcceptDiff?: () => void
  onRejectDiff?: () => void
  onToggleTerminal?: () => void
}

const FILE_ICONS: Record<string, string> = {
  tsx: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#2563eb"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="7" font-weight="bold">T</text></svg>',
  ts: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#3178c6"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">TS</text></svg>',
  js: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#f0db4f"/><text x="8" y="11.5" text-anchor="middle" fill="#323330" font-size="6" font-weight="bold">JS</text></svg>',
  json: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#f5a623"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">{"}</text></svg>',
  css: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#1572b6"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">#</text></svg>',
  md: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#42a5f5"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="5" font-weight="bold">MD</text></svg>',
  prisma: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#0c344b"/><text x="8" y="11.5" text-anchor="middle" fill="#5a67d8" font-size="5" font-weight="bold">PR</text></svg>',
  env: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#ecd540"/><text x="8" y="11.5" text-anchor="middle" fill="#333" font-size="5" font-weight="bold">ENV</text></svg>',
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot === -1) return ''
  return name.substring(dot + 1).toLowerCase()
}

function getFileIcon(ext: string): string {
  return FILE_ICONS[ext] || '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#484f58"/></svg>'
}

function tokenizeLine(line: string, language: string): { text: string; className: string }[] {
  const tokens: { text: string; className: string }[] = []
  let remaining = line
  let pos = 0

  const patterns: { regex: RegExp; className: string }[] = [
    { regex: /^\/\/.*$/, className: 'text-[#6e7681]' },
    { regex: /^\/\*[\s\S]*?\*\//, className: 'text-[#6e7681]' },
    { regex: /^"[^"]*"/, className: 'text-[#a5d6ff]' },
    { regex: /^'[^']*'/, className: 'text-[#a5d6ff]' },
    { regex: /^`[^`]*`/, className: 'text-[#a5d6ff]' },
    { regex: /^\d+/, className: 'text-[#79c0ff]' },
    { regex: /^(import|export|from|default|as|type|interface|enum|class|extends|implements|const|let|var|function|async|await|return|if|else|for|while|of|in|new|throw|try|catch|finally|switch|case|break|continue|typeof|instanceof|void|never|unknown|any|boolean|string|number|null|undefined|true|false)\b/, className: 'text-[#ff7b72]' },
    { regex: /^[A-Z][a-zA-Z]+/, className: 'text-[#d2a8ff]' },
    { regex: /^[a-zA-Z_]\w*/, className: 'text-[#e6edf3]' },
  ]

  while (pos < remaining.length) {
    let matched = false
    for (const { regex, className } of patterns) {
      const m = remaining.slice(pos).match(regex)
      if (m && m.index === 0) {
        if (tokens.length > 0 && tokens[tokens.length - 1].className === className) {
          tokens[tokens.length - 1].text += m[0]
        } else {
          tokens.push({ text: m[0], className })
        }
        pos += m[0].length
        matched = true
        break
      }
    }
    if (!matched) {
      if (tokens.length > 0 && tokens[tokens.length - 1].className === 'text-[#e6edf3]') {
        tokens[tokens.length - 1].text += remaining[pos]
      } else {
        tokens.push({ text: remaining[pos], className: 'text-[#e6edf3]' })
      }
      pos++
    }
  }

  return tokens
}

function linesDiff(a: string, b: string): { added: number[]; removed: number[] } {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const added: number[] = []
  const removed: number[] = []

  const maxLen = Math.max(aLines.length, bLines.length)
  for (let i = 0; i < maxLen; i++) {
    if (i >= aLines.length) { added.push(i + 1); continue }
    if (i >= bLines.length) { removed.push(i + 1); continue }
    if (aLines[i] !== bLines[i]) {
      removed.push(i + 1)
      added.push(i + 1)
    }
  }
  return { added, removed }
}

function simpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-semibold mt-4 mb-1 text-[#e6edf3]">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-[17px] font-semibold mt-5 mb-2 text-[#e6edf3]">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-[20px] font-bold mt-6 mb-3 text-[#e6edf3]">$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#21262d] text-[#e6edf3] px-1 py-0.5 rounded text-[12px]">$1</code>')
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-[#161b22] border border-[#30363d] rounded-lg p-3 my-2 overflow-x-auto"><code class="text-[12px]">$2</code></pre>')
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-[#e6edf3]">$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-[#e6edf3]">$1</li>')
  html = html.replace(/\n\n/g, '</p><p class="text-[13px] leading-relaxed text-[#e6edf3]">')
  return `<p class="text-[13px] leading-relaxed text-[#e6edf3]">${html}</p>`
}

export function IDEEditor({
  openFiles,
  activeTabId,
  activeFile,
  diagnostics,
  onTabSelect,
  onTabClose,
  onSendToChat,
  onUpdateTab,
  gitDiffBefore,
  gitDiffAfter,
  onAcceptDiff,
  onRejectDiff,
  onToggleTerminal
}: IDEEditorProps) {
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDiffTab, setShowDiffTab] = useState(false)
  const [showPreviewTab, setShowPreviewTab] = useState(false)
  const [showProblems, setShowProblems] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorHoverRef = useRef<HTMLDivElement>(null)
  const tabsScrollRef = useRef<HTMLDivElement>(null)

  const activeTab = openFiles.find(t => t.id === activeTabId)

  useEffect(() => {
    if (!activeTab || activeTab.content) return
    const loadContent = async () => {
      try {
        const res = await fetch(`${IDE_SERVER_URL}/files/read?path=${encodeURIComponent(activeTab.path)}`, {
          headers: getIDEHeaders()
        })
        if (!res.ok) return
        const data = await res.json()
        onUpdateTab(activeTab.id, { content: data.content, language: data.language, isDirty: false })
      } catch { /* ignore */ }
    }
    loadContent()
  }, [activeTab?.id])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    setIsEditing(false)
    setEditContent('')
  }, [activeTabId])

  const handleCopyContent = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content).catch(() => {})
    }
  }

  const handleEdit = () => {
    if (activeFile) {
      setEditContent(activeFile.content)
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (!activeFile || !activeTab) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/write`, {
        method: 'POST',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ path: activeFile.path, content: editContent })
      })
      onUpdateTab(activeTab.id, { content: editContent, isDirty: false })
      setIsEditing(false)
    } catch { /* ignore */ }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = editContent.substring(0, start) + '  ' + editContent.substring(end)
      setEditContent(newValue)
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') { handleTabKey(e); return }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const fileDiagnostics = diagnostics.filter(d => {
    if (!activeFile) return false
    return d.file === activeFile.path || d.file.endsWith(activeFile.path)
  })

  const diagnosticLines = new Map<number, Diagnostic[]>()
  for (const d of fileDiagnostics) {
    const list = diagnosticLines.get(d.line) || []
    list.push(d)
    diagnosticLines.set(d.line, list)
  }

  const { added, removed } = activeFile && gitDiffBefore
    ? linesDiff(gitDiffBefore, activeFile.content)
    : { added: [], removed: [] }

  const renderViewMode = () => {
    if (!activeFile) return null
    const lines = activeFile.content.split('\n')
    const lang = activeFile.language || 'text'

    return (
      <div className="flex">
        <div className="select-none text-right pr-3 pt-2 pb-4 text-[#484f58] text-[13px] leading-[1.6] font-mono shrink-0"
             style={{ minWidth: '40px' }}>
          {lines.map((_, i) => (
            <div key={i} className="h-[20.8px]">{i + 1}</div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto pt-2 pb-4 font-mono text-[13px] leading-[1.6]">
          {lines.map((line, i) => {
            const diags = diagnosticLines.get(i + 1)
            const isAdded = added.includes(i + 1) && gitDiffBefore
            const isRemoved = removed.includes(i + 1) && gitDiffBefore
            return (
              <div
                key={i}
                className={`h-[20.8px] flex whitespace-pre ${diags ? 'bg-red-500/10' : ''} ${
                  isAdded ? 'bg-green-500/10 border-l-[3px] border-l-green-500 pl-1' :
                  isRemoved ? 'bg-red-500/10 border-l-[3px] border-l-red-500 pl-1' : ''
                }`}
                title={diags ? diags.map(d => `[${d.severity.toUpperCase()}] ${d.message}`).join('\n') : undefined}
              >
                {tokenizeLine(line, lang).map((t, j) => (
                  <span key={j} className={t.className}>{t.text}</span>
                ))}
                {line === '' && <span>{'\u00A0'}</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDiffView = () => {
    if (!gitDiffBefore || !gitDiffAfter) return null
    const beforeLines = gitDiffBefore.split('\n')
    const afterLines = gitDiffAfter.split('\n')
    let adds = 0
    let dels = 0
    const maxLen = Math.max(beforeLines.length, afterLines.length)

    return (
      <div className="flex flex-col h-full">
        <div className="flex border-b border-[#21262d] bg-[#161b22]">
          <div className="flex-1 px-3 py-1 text-[11px] text-[#8b949e]">Antes — {activeFile?.path?.split('/').pop()}</div>
          <div className="flex-1 px-3 py-1 text-[11px] text-[#8b949e] border-l border-[#21262d]">Depois</div>
        </div>
        <div className="flex flex-1 overflow-auto">
          <div className="flex-1 font-mono text-[13px] leading-[1.6] overflow-auto">
            {beforeLines.map((line, i) => {
              const changed = afterLines[i] !== undefined && line !== afterLines[i]
              if (changed) dels++
              return (
                <div key={i} className={`h-[20.8px] flex ${changed ? 'bg-[#2b1c1c]' : ''}`}>
                  <span className="w-10 text-right text-[#484f58] pr-2 select-none shrink-0">{i + 1}</span>
                  {changed && <span className="text-red-400 pl-1 select-none">-</span>}
                  <span className={`whitespace-pre ${changed ? 'text-red-300' : 'text-[#e6edf3]'}`}>{line}</span>
                </div>
              )
            })}
          </div>
          <div className="flex-1 font-mono text-[13px] leading-[1.6] overflow-auto border-l border-[#21262d]">
            {afterLines.map((line, i) => {
              const changed = beforeLines[i] !== undefined && line !== beforeLines[i]
              if (changed) adds++
              return (
                <div key={i} className={`h-[20.8px] flex ${changed ? 'bg-[#1c2b1c]' : ''}`}>
                  <span className="w-10 text-right text-[#484f58] pr-2 select-none shrink-0">{i + 1}</span>
                  {changed && <span className="text-green-400 pl-1 select-none">+</span>}
                  <span className={`whitespace-pre ${changed ? 'text-green-300' : 'text-[#e6edf3]'}`}>{line}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] text-[11px]">
          <span className="text-[#8b949e]">+{adds} linhas  -{dels} linhas</span>
          <div className="flex items-center gap-2">
            <button onClick={onAcceptDiff} className="px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-500 text-[10px]">✓ Aceitar Tudo</button>
            <button onClick={onRejectDiff} className="px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-500 text-[10px]">✗ Rejeitar Tudo</button>
            <button className="px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] text-[10px]">Revisar linha a linha</button>
          </div>
        </div>
      </div>
    )
  }

  const renderPreview = () => {
    if (!activeFile) return null
    const html = simpleMarkdown(activeFile.content)
    return (
      <div className="p-4 overflow-auto h-full prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  const renderProblems = () => {
    return (
      <div className="p-3 h-full overflow-auto">
        <div className="text-[11px] font-medium text-[#8b949e] uppercase mb-2">Problemas</div>
        {fileDiagnostics.length === 0 ? (
          <p className="text-[12px] text-[#484f58]">Nenhum problema encontrado</p>
        ) : (
          fileDiagnostics.map((d, i) => (
            <div key={i} className="flex items-start gap-2 py-1 text-[12px]">
              <span className={d.severity === 'error' ? 'text-red-400 shrink-0 mt-0.5' : 'text-yellow-400 shrink-0 mt-0.5'}>
                {d.severity === 'error' ? '⊗' : '⚠'}
              </span>
              <div>
                <span className="text-[#e6edf3]">{d.message}</span>
                <span className="text-[#484f58] ml-2">
                  Ln {d.line}, Col {d.col} · {d.code}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const isMdPreview = activeFile && (activeFile.path.endsWith('.md') || activeFile.path.endsWith('.MD'))

  return (
    <div className="flex flex-col overflow-hidden" style={{ gridArea: 'editor' }}>
      <div
        ref={tabsScrollRef}
        className="flex items-center shrink-0 border-b border-[#21262d] bg-[#161b22] overflow-x-auto scrollbar-none"
        style={{ height: '32px' }}
      >
        {openFiles.map(tab => {
          const ext = getExt(tab.name)
          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex items-center gap-1.5 px-3 cursor-pointer border-r border-[#21262d] shrink-0 select-none group h-full ${
                tab.id === activeTabId
                  ? 'bg-[#0d1117] text-[#e6edf3] border-t-[1px] border-t-[#1f6feb]'
                  : 'text-[#8b949e] hover:bg-[#21262d]'
              }`}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                dangerouslySetInnerHTML={{ __html: getFileIcon(ext) }} />
              <span className="text-[12px] truncate max-w-[140px]">{tab.name}</span>
              {tab.isDirty && <span className="text-orange-400 text-[10px] leading-none">●</span>}
              <button
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id) }}
                className={`p-0.5 rounded hover:bg-[#30363d] ${tab.id === activeTabId ? '' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        <div className="flex-1" />

        <button
          onClick={() => setShowProblems(!showProblems)}
          className={`flex items-center gap-1 px-2.5 h-full text-[11px] shrink-0 border-l border-[#21262d] ${showProblems ? 'bg-[#0d1117] text-[#e6edf3]' : 'text-[#8b949e] hover:bg-[#21262d]'}`}
        >
          PROBLEMAS
          {fileDiagnostics.length > 0 && (
            <span className="text-red-400 text-[10px]">{fileDiagnostics.length}</span>
          )}
        </button>
        <button
          onClick={onToggleTerminal}
          className="flex items-center gap-1 px-2.5 h-full text-[11px] text-[#8b949e] hover:bg-[#21262d] shrink-0 border-l border-[#21262d]"
        >
          TERMINAL
        </button>
        {isMdPreview && (
          <button
            onClick={() => setShowPreviewTab(!showPreviewTab)}
            className={`flex items-center gap-1 px-2.5 h-full text-[11px] shrink-0 border-l border-[#21262d] ${showPreviewTab ? 'bg-[#0d1117] text-[#e6edf3]' : 'text-[#8b949e] hover:bg-[#21262d]'}`}
          >
            <Eye className="w-3 h-3" />
            PREVIEW
          </button>
        )}
        {gitDiffBefore && gitDiffAfter && (
          <button
            onClick={() => setShowDiffTab(!showDiffTab)}
            className={`flex items-center gap-1 px-2.5 h-full text-[11px] shrink-0 border-l border-[#21262d] ${showDiffTab ? 'bg-[#0d1117] text-[#e6edf3]' : 'text-[#8b949e] hover:bg-[#21262d]'}`}
          >
            <GitCompare className="w-3 h-3" />
            DIFF
          </button>
        )}
      </div>

      {activeFile && (
        <div className="flex items-center px-3 text-[11px] text-[#8b949e] border-b border-[#21262d] bg-[#0d1117] shrink-0"
             style={{ height: '24px' }}>
          {activeFile.path.split(/[\\/]/).map((part, i, arr) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-1 opacity-40">/</span>}
              <span className={i === arr.length - 1 ? 'text-[#e6edf3]' : 'hover:text-[#e6edf3] cursor-pointer'}>
                {part}
              </span>
            </span>
          ))}
        </div>
      )}

      <div
        ref={editorHoverRef}
        className="flex-1 overflow-hidden bg-[#0d1117] relative"
      >
        {showDiffTab && gitDiffBefore && gitDiffAfter ? (
          renderDiffView()
        ) : showPreviewTab && isMdPreview ? (
          renderPreview()
        ) : showProblems ? (
          renderProblems()
        ) : activeFile ? (
          <div className="h-full relative group/editor">
            {!isEditing && (
              <div className="absolute top-2 right-3 z-10 flex items-center gap-1 opacity-0 group-hover/editor:opacity-100 transition-opacity">
                <button onClick={handleCopyContent} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] text-[10px]"><Copy className="w-3 h-3"/> Copiar</button>
                <button onClick={() => onSendToChat(activeFile.content)} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] text-[10px]"><Wand2 className="w-3 h-3"/> Abrir com IA</button>
                <button onClick={handleEdit} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] text-[10px]"><Pencil className="w-3 h-3"/> Editar</button>
              </div>
            )}
            {isEditing ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border-b border-[#21262d] text-[10px] shrink-0">
                  <button onClick={handleSave} className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-700 text-white hover:bg-green-600"><Save className="w-3 h-3"/> Salvar (Ctrl+S)</button>
                  <button onClick={handleCancelEdit} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]"><X className="w-3 h-3"/> Cancelar</button>
                  <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] ml-auto"><Wand2 className="w-3 h-3"/> Formatar com IA</button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => { setEditContent(e.target.value); onUpdateTab(activeTab!.id, { isDirty: true }) }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 w-full bg-transparent border-none outline-none resize-none p-4 font-mono text-[13px] leading-[1.6] text-[#e6edf3] scrollbar-thin"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="h-full overflow-auto">
                {renderViewMode()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4 opacity-20">📄</div>
            <p className="text-[13px] text-[#484f58] mb-1">Nenhum arquivo aberto</p>
            <p className="text-[11px] text-[#484f58]">
              Use <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px] border border-[#30363d]">Ctrl+P</kbd> para abrir um arquivo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
