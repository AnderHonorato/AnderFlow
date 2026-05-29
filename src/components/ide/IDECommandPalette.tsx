"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, File, Command, Terminal, GitBranch, Wrench, X,
  FilePlus, File as FileIcon, FolderOpen, Save, SaveAll, RefreshCw,
  Bot, Settings, AlertCircle, GitCommit, Plus, Download, Code2
} from 'lucide-react'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  type: 'command'
  action: () => void
}

interface FileItem {
  id: string
  name: string
  path: string
  type: 'file'
}

interface SymbolItem {
  id: string
  name: string
  kind: string
  line: number
  file: string
  type: 'symbol'
}

interface SessionItem {
  id: string
  name: string
  type: 'session'
}

type PaletteItem = FileItem | SymbolItem | SessionItem | CommandItem

interface IDECommandPaletteProps {
  onClose: () => void
  onOpenFile: (path: string, line?: number) => void
  onToggleTerminal: () => void
  onToggleChat: () => void
  onGitCommit: () => void
  onNewFile: () => void
  onSaveFile: () => void
  activeFilePath?: string | null
}

const COMMANDS: CommandItem[] = [
  { id: 'cmd-new-file', label: 'Novo Arquivo', description: 'Criar novo arquivo', icon: <FilePlus className="w-4 h-4" />, shortcut: 'Ctrl+N', type: 'command', action: () => {} },
  { id: 'cmd-save', label: 'Salvar Arquivo', description: 'Salvar o arquivo ativo', icon: <Save className="w-4 h-4" />, shortcut: 'Ctrl+S', type: 'command', action: () => {} },
  { id: 'cmd-save-all', label: 'Salvar Todos', description: 'Salvar todos os arquivos', icon: <SaveAll className="w-4 h-4" />, shortcut: 'Ctrl+Shift+S', type: 'command', action: () => {} },
  { id: 'cmd-refresh', label: 'Recarregar Explorer', description: 'Atualizar árvore de arquivos', icon: <RefreshCw className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-toggle-term', label: 'Toggle Terminal', description: 'Mostrar/esconder terminal', icon: <Terminal className="w-4 h-4" />, shortcut: 'Ctrl+`', type: 'command', action: () => {} },
  { id: 'cmd-toggle-chat', label: 'Toggle Chat IA', description: 'Mostrar/esconder chat', icon: <Bot className="w-4 h-4" />, shortcut: 'Ctrl+Shift+X', type: 'command', action: () => {} },
  { id: 'cmd-settings', label: 'Abrir Configurações', description: 'Configurações do IDE', icon: <Settings className="w-4 h-4" />, shortcut: 'Ctrl+,', type: 'command', action: () => {} },
  { id: 'cmd-typecheck', label: 'Executar Verificação de Tipos', description: 'Rodar TypeScript check', icon: <AlertCircle className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-git-stage', label: 'Git: Stage All', description: 'Adicionar todos ao stage', icon: <GitCommit className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-git-commit', label: 'Git: Commit', description: 'Criar commit', icon: <GitCommit className="w-4 h-4" />, shortcut: 'Ctrl+Shift+K', type: 'command', action: () => {} },
  { id: 'cmd-new-session', label: 'Nova Sessão de Chat', description: 'Iniciar nova conversa', icon: <Plus className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-export', label: 'Exportar Sessão', description: 'Exportar sessão atual', icon: <Download className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-mode-programmer', label: 'Modo: Programador', description: 'Ativar modo programador', icon: <Code2 className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-mode-agent', label: 'Modo: Agente', description: 'Ativar modo agente', icon: <Bot className="w-4 h-4" />, type: 'command', action: () => {} },
  { id: 'cmd-close-ide', label: 'Fechar IDE', description: 'Voltar ao dashboard', icon: <X className="w-4 h-4" />, type: 'command', action: () => {} },
]

const FILE_ICON_COLORS: Record<string, string> = {
  tsx: '#2563eb', ts: '#3178c6', js: '#f0db4f', jsx: '#2563eb',
  css: '#1572b6', json: '#f5a623', md: '#42a5f5', prisma: '#0c344b',
  env: '#ecd540', svg: '#8b5cf6', png: '#8b5cf6', jpg: '#8b5cf6',
}

function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICON_COLORS[ext] || '#8b949e'
}

const HISTORY_KEY = 'ide_palette_history'

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(path: string) {
  const history = loadHistory().filter(h => h !== path)
  history.unshift(path)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)))
}

export function IDECommandPalette({
  onClose, onOpenFile, onToggleTerminal, onToggleChat,
  onGitCommit, onNewFile, onSaveFile, activeFilePath
}: IDECommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [files, setFiles] = useState<FileItem[]>([])
  const [symbols, setSymbols] = useState<SymbolItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleGlobalEsc)
    return () => window.removeEventListener('keydown', handleGlobalEsc)
  }, [onClose])

  const fetchFiles = useCallback(async (q: string) => {
    try {
      const params = new URLSearchParams({ query: q })
      const res = await fetch(`${IDE_SERVER_URL}/files/search?${params}`, {
        headers: { 'X-IDE-Key': IDE_KEY },
        signal: AbortSignal.timeout(5000)
      })
      const data = await res.json()
      const items: FileItem[] = (data.results || []).map((r: any) => {
        const name = r.file.split('/').pop() || r.file
        return { id: r.file, name, path: r.file, type: 'file' }
      })
      setFiles(items.slice(0, 10))
    } catch { setFiles([]) }
  }, [])

  const fetchSymbols = useCallback(async (q: string) => {
    if (!activeFilePath) { setSymbols([]); return }
    try {
      const params = new URLSearchParams({ path: activeFilePath })
      const res = await fetch(`${IDE_SERVER_URL}/lsp/symbols?${params}`, {
        headers: { 'X-IDE-Key': IDE_KEY },
        signal: AbortSignal.timeout(5000)
      })
      const data = await res.json()
      const items: SymbolItem[] = (data.symbols || []).map((s: any) => ({
        id: `${activeFilePath}:${s.line}`,
        name: s.name,
        kind: s.kind,
        line: s.line,
        file: activeFilePath,
        type: 'symbol'
      }))
      setSymbols(items.filter((s: SymbolItem) => s.name.toLowerCase().includes(q.toLowerCase())))
    } catch { setSymbols([]) }
  }, [activeFilePath])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/sessions/list`, {
        headers: { 'X-IDE-Key': IDE_KEY },
        signal: AbortSignal.timeout(5000)
      })
      const data = await res.json()
      setSessions((data.sessions || []).map((s: any) => ({
        id: s.id, name: s.name, type: 'session' as const
      })))
    } catch { setSessions([]) }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedIdx(0)

    if (debounceTimer) clearTimeout(debounceTimer)

    if (!value) {
      setFiles([]); setSymbols([]); return
    }

    const prefix = value[0]

    if (prefix === '>' && value.length > 1) {
      setFiles([]); setSymbols([])
      return
    }

    if (prefix === '@' && activeFilePath) {
      fetchSymbols(value.slice(1))
      return
    }

    if (prefix === '#') {
      fetchSessions()
      return
    }

    const timer = setTimeout(() => fetchFiles(value), 200)
    setDebounceTimer(timer)
  }

  const commands = query.startsWith('>') && query.length > 1
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.slice(1).toLowerCase()) ||
        c.description.toLowerCase().includes(query.slice(1).toLowerCase())
      )
    : []

  const recentPaths = loadHistory()

  const recentItems: PaletteItem[] = !query && recentPaths.length > 0
    ? recentPaths.map(p => {
        const name = p.split('/').pop() || p
        return { id: p, name, path: p, type: 'file' }
      })
    : []

  const allItems: PaletteItem[] = [
    ...(query.startsWith('#') ? sessions : []),
    ...(query.startsWith('@') ? symbols : []),
    ...(query.startsWith('>') ? commands : []),
    ...(!query.startsWith('>') && !query.startsWith('@') && !query.startsWith('#') ? files : []),
  ]

  const displayItems = query ? allItems : recentItems

  const handleSelect = (item: PaletteItem) => {
    switch (item.type) {
      case 'file':
        saveHistory(item.path)
        onOpenFile(item.path)
        break
      case 'symbol':
        onOpenFile(item.file, item.line)
        break
      case 'session':
        onClose()
        break
      case 'command':
        item.action()
        break
    }
    onClose()
  }

  const getCommandActions = (): Record<string, () => void> => ({
    'cmd-new-file': onNewFile,
    'cmd-save': onSaveFile,
    'cmd-toggle-term': onToggleTerminal,
    'cmd-toggle-chat': onToggleChat,
    'cmd-git-commit': onGitCommit,
    'cmd-close-ide': onClose,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(prev => Math.min(prev + 1, displayItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (displayItems[selectedIdx]) {
        const item = displayItems[selectedIdx]
        const actions = getCommandActions()
        if (item.type === 'command' && actions[item.id]) {
          actions[item.id]()
        } else {
          handleSelect(item)
        }
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIdx])

  const showRecentLabel = !query && recentItems.length > 0

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-[#1c2128] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#21262d]">
          <Search className="w-4 h-4 text-[#8b949e] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar arquivos, comandos... (> para comandos)"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e6edf3] placeholder-[#484f58]"
          />
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showRecentLabel && (
          <div className="px-3 pt-2 pb-1 text-[10px] text-[#8b949e] uppercase tracking-wider">Recentes</div>
        )}

        <div ref={listRef} className="max-h-[280px] overflow-y-auto scrollbar-thin">
          {displayItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                const actions = getCommandActions()
                if (item.type === 'command' && actions[item.id]) {
                  actions[item.id]()
                } else {
                  handleSelect(item)
                }
              }}
              className={`flex items-center gap-3 px-3 py-2 w-full text-left transition-colors ${
                idx === selectedIdx ? 'bg-[#1f6feb]/30 border-l-2 border-[#1f6feb]' : 'border-l-2 border-transparent hover:bg-[#21262d]'
              }`}
            >
              {item.type === 'file' && (
                <>
                  <File className="w-4 h-4 shrink-0" style={{ color: getFileColor(item.name) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#e6edf3]">{item.name}</p>
                    <p className="text-[11px] text-[#8b949e] truncate">{item.path}</p>
                  </div>
                </>
              )}
              {item.type === 'symbol' && (
                <>
                  <span className="text-[11px] w-10 shrink-0 text-[#d2a8ff]">{item.kind}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#e6edf3]">{item.name}</p>
                    <p className="text-[11px] text-[#8b949e]">Ln {item.line} · {item.file}</p>
                  </div>
                </>
              )}
              {item.type === 'session' && (
                <>
                  <FolderOpen className="w-4 h-4 shrink-0 text-[#8b949e]" />
                  <p className="text-[13px] text-[#e6edf3]">{item.name}</p>
                </>
              )}
              {item.type === 'command' && (
                <>
                  <span className="shrink-0 text-[#8b949e]">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#e6edf3]">{item.label}</p>
                    <p className="text-[11px] text-[#484f58] truncate">{item.description}</p>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] text-[#484f58] px-1.5 py-0.5 rounded bg-[#21262d] shrink-0">{item.shortcut}</span>
                  )}
                </>
              )}
            </button>
          ))}

          {displayItems.length === 0 && query && (
            <p className="text-center text-[12px] text-[#484f58] py-8">Nenhum resultado encontrado</p>
          )}
        </div>

        {!query && (
          <div className="px-3 py-1.5 border-t border-[#21262d] text-[10px] text-[#484f58] flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>Enter selecionar</span>
            <span>Esc fechar</span>
            <span className="ml-auto">&gt; comandos · @ símbolos · # sessões</span>
          </div>
        )}
      </div>
    </div>
  )
}
