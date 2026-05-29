"use client"

import { useState, useRef, useEffect } from 'react'
import { Terminal, X, Plus, Loader2, ChevronRight, ChevronDown, AlertCircle, GitBranch, Wand2 } from 'lucide-react'
import type { Diagnostic, GitStats } from './ide-types'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error'
  content: string
  timestamp: string
}

interface TerminalTab {
  id: string
  name: string
  type: 'terminal' | 'problems' | 'output' | 'git'
  lines?: TerminalLine[]
}

interface OutputLog {
  id: string
  timestamp: string
  category: 'INFO' | 'WARN' | 'ERROR' | 'OK'
  message: string
}

interface GitFile {
  path: string
  status: string
  staged: boolean
}

interface CommitLog {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  files: string[]
}

interface IDETerminalProps {
  onToggle: () => void
  onClose: () => void
  onHeightDrag: (deltaY: number) => void
  diagnostics: Diagnostic[]
  gitStats: GitStats
  activeFilePath: string | null
  onOpenFile: (path: string, line?: number) => void
  onFixError: (error: Diagnostic) => void
  onUpdateDiagnostics: (diags: Diagnostic[]) => void
}

let nextTermId = 1

function parseAnsi(text: string): { text: string; style: React.CSSProperties }[] {
  const parts: { text: string; style: React.CSSProperties }[] = []
  let remaining = text
  let currentStyle: React.CSSProperties = {}

  const ansiRegex = /\x1b\[(\d+)m/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = ansiRegex.exec(remaining)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ text: remaining.slice(lastIdx, match.index), style: { ...currentStyle } })
    }
    const code = parseInt(match[1])
    switch (code) {
      case 0: currentStyle = {}; break
      case 31: currentStyle = { ...currentStyle, color: '#f85149' }; break
      case 32: currentStyle = { ...currentStyle, color: '#3fb950' }; break
      case 33: currentStyle = { ...currentStyle, color: '#e3b341' }; break
      case 34: currentStyle = { ...currentStyle, color: '#58a6ff' }; break
      case 35: currentStyle = { ...currentStyle, color: '#d2a8ff' }; break
      case 36: currentStyle = { ...currentStyle, color: '#a5d6ff' }; break
      case 1: currentStyle = { ...currentStyle, fontWeight: 'bold' }; break
    }
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < remaining.length) {
    parts.push({ text: remaining.slice(lastIdx), style: { ...currentStyle } })
  }

  return parts
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function IDETerminal({
  onToggle, onClose, onHeightDrag,
  diagnostics, gitStats,
  activeFilePath, onOpenFile, onFixError, onUpdateDiagnostics
}: IDETerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'terminal-1', name: 'TERMINAL 1', type: 'terminal', lines: [] },
    { id: 'problems', name: 'PROBLEMAS', type: 'problems' },
    { id: 'output', name: 'SAÍDA', type: 'output' },
    { id: 'git', name: 'GIT', type: 'git' }
  ])
  const [activeTabId, setActiveTabId] = useState('terminal-1')
  const [dragging, setDragging] = useState(false)

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      onHeightDrag(startY - ev.clientY)
    }
    const onUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const addTerminal = () => {
    const id = `terminal-${++nextTermId}`
    setTabs(prev => [...prev, { id, name: `TERMINAL ${nextTermId}`, type: 'terminal', lines: [] }])
    setActiveTabId(id)
  }

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (activeTabId === id) {
        setActiveTabId(next[0]?.id || '')
      }
      return next
    })
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className="flex flex-col overflow-hidden" style={{ gridArea: 'terminal', background: '#0d1117' }}>
      <div
        className="h-1 cursor-row-resize hover:bg-[#1f6feb]/50 transition-colors shrink-0"
        onMouseDown={handleDragStart}
        style={{ background: dragging ? '#1f6feb' : 'transparent' }}
      />

      <div className="flex items-center bg-[#161b22] border-b border-[#21262d] shrink-0" style={{ height: '32px' }}>
        <div className="flex items-center h-full overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-[#21262d] select-none shrink-0 ${
                tab.id === activeTabId ? 'bg-[#0d1117] text-[#e6edf3] border-t-[1px] border-t-[#1f6feb]' : 'text-[#8b949e] hover:bg-[#21262d]'
              }`}
            >
              {tab.type === 'terminal' && <Terminal className="w-3 h-3" />}
              {tab.type === 'problems' && <AlertCircle className="w-3 h-3" />}
              {tab.type === 'output' && <span className="text-[10px]">📋</span>}
              {tab.type === 'git' && <GitBranch className="w-3 h-3" />}
              <span className="text-[11px]">{tab.name}</span>
              {tab.type === 'terminal' && tab.id !== 'terminal-1' && (
                <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }} className="hover:text-[#e6edf3]">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addTerminal} className="p-1 mx-1 rounded hover:bg-[#21262d] text-[#8b949e] shrink-0" title="Novo terminal">
          <Plus className="w-3 h-3" />
        </button>
        <div className="flex-1" />
        <button onClick={onToggle} className="p-1 mr-1 rounded hover:bg-[#21262d] text-[#8b949e] shrink-0" title="Maximizar">
          <ChevronRight className="w-3 h-3 rotate-90" />
        </button>
        <button onClick={onClose} className="p-1 mr-1 rounded hover:bg-[#21262d] text-[#8b949e] shrink-0" title="Fechar">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab?.type === 'terminal' && (
          <TerminalContent tabId={activeTab.id} lines={activeTab.lines || []} setTabs={setTabs} />
        )}
        {activeTab?.type === 'problems' && (
          <ProblemsContent
            diagnostics={diagnostics}
            activeFilePath={activeFilePath}
            onOpenFile={onOpenFile}
            onFixError={onFixError}
            onUpdateDiagnostics={onUpdateDiagnostics}
          />
        )}
        {activeTab?.type === 'output' && (
          <OutputContent />
        )}
        {activeTab?.type === 'git' && (
          <GitContent gitStats={gitStats} />
        )}
      </div>
    </div>
  )
}

function TerminalContent({ tabId, lines, setTabs }: { tabId: string; lines: TerminalLine[]; setTabs: React.Dispatch<React.SetStateAction<TerminalTab[]>> }) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [showTimestamp, setShowTimestamp] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  const updateLines = (newLines: TerminalLine[]) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, lines: newLines } : t))
  }

  const addLine = (line: TerminalLine) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, lines: [...(t.lines || []), line] } : t))
  }

  const runCommand = async (cmd: string) => {
    if (!cmd.trim()) return
    setInput('')
    setHistory(prev => [...prev, cmd].slice(-100))
    setHistoryIdx(-1)

    addLine({ id: Date.now().toString(), type: 'input', content: cmd, timestamp: new Date().toISOString() })
    setIsRunning(true)

    try {
      const res = await fetch(`${IDE_SERVER_URL}/terminal/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ command: cmd, timeout: 60000 })
      })
      const data = await res.json()
      const output = (data.stdout || '') + (data.stderr || '')
      if (output) {
        addLine({ id: (Date.now() + 1).toString(), type: data.exitCode !== 0 ? 'error' : 'output', content: output, timestamp: new Date().toISOString() })
      }
    } catch {
      addLine({ id: (Date.now() + 1).toString(), type: 'error', content: 'Erro ao executar comando', timestamp: new Date().toISOString() })
    }
    setIsRunning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(newIdx)
      setInput(history[history.length - 1 - newIdx] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(newIdx)
      setInput(newIdx === -1 ? '' : history[history.length - 1 - newIdx] || '')
    }
  }

  const clearTerminal = () => {
    updateLines([])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end px-2 py-0.5 shrink-0">
        <button onClick={() => setShowTimestamp(!showTimestamp)} className="text-[9px] text-[#8b949e] hover:text-[#e6edf3] mr-2">
          {showTimestamp ? 'Ocultar timestamps' : 'Mostrar timestamps'}
        </button>
        <button onClick={clearTerminal} className="text-[9px] text-[#8b949e] hover:text-[#e6edf3]">
          Limpar
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[12px] leading-relaxed scrollbar-thin" onClick={() => inputRef.current?.focus()}>
        {lines.map(line => (
          <div key={line.id}>
            {showTimestamp && <span className="text-[#484f58] text-[10px]">{new Date(line.timestamp).toLocaleTimeString()} </span>}
            {line.type === 'input' ? (
              <span><span className="text-[#3fb950]">$ </span><span className="text-[#e6edf3]">{line.content}</span></span>
            ) : (
              <pre className={`whitespace-pre-wrap ${line.type === 'error' ? 'text-red-400' : 'text-[#e6edf3]'}`}>
                {parseAnsi(line.content).map((p, i) => (
                  <span key={i} style={p.style}>{p.text}</span>
                ))}
              </pre>
            )}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-[#8b949e] py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Executando...
            <button onClick={() => {}} className="text-[10px] text-red-400 hover:text-red-300">✕ Cancelar</button>
          </div>
        )}
      </div>
      <div className="flex items-center bg-[#161b22] border-t border-[#21262d] px-2 py-1 shrink-0">
        <span className="text-[#3fb950] font-mono text-[12px] mr-1 select-none">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] font-mono text-[12px] placeholder-[#484f58]"
          placeholder="Digite um comando..."
        />
      </div>
    </div>
  )
}

function ProblemsContent({
  diagnostics, activeFilePath, onOpenFile, onFixError, onUpdateDiagnostics
}: {
  diagnostics: Diagnostic[]
  activeFilePath: string | null
  onOpenFile: (path: string, line?: number) => void
  onFixError: (error: Diagnostic) => void
  onUpdateDiagnostics: (diags: Diagnostic[]) => void
}) {
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all')
  const [running, setRunning] = useState(false)

  const runDiagnostics = async () => {
    setRunning(true)
    try {
      const res = await fetch(`${IDE_SERVER_URL}/lsp/diagnostics`, {
        headers: { 'X-IDE-Key': IDE_KEY }
      })
      const data = await res.json()
      onUpdateDiagnostics(data.errors || [])
    } catch { /* ignore */ }
    setRunning(false)
  }

  const filtered = diagnostics.filter(d => {
    if (filter === 'errors') return d.severity === 'error'
    if (filter === 'warnings') return d.severity === 'warning'
    return true
  })

  const grouped = new Map<string, Diagnostic[]>()
  for (const d of filtered) {
    const list = grouped.get(d.file) || []
    list.push(d)
    grouped.set(d.file, list)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d] shrink-0">
        <button onClick={runDiagnostics} disabled={running} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[10px] text-[#e6edf3] disabled:opacity-50">
          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : '▶'} Executar verificação
        </button>
        <div className="flex items-center rounded bg-[#21262d] overflow-hidden">
          {(['all', 'errors', 'warnings'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 text-[10px] ${filter === f ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}>
              {f === 'all' ? 'Todos' : f === 'errors' ? 'Erros' : 'Avisos'}
              <span className="ml-1 opacity-60">
                ({f === 'all' ? diagnostics.length : f === 'errors' ? diagnostics.filter(d => d.severity === 'error').length : diagnostics.filter(d => d.severity === 'warning').length})
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { for (const d of filtered) onFixError(d) }}
          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#58a6ff] hover:bg-[#1f6feb]/10"
        >
          <Wand2 className="w-3 h-3" /> Corrigir Todos
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {Array.from(grouped.entries()).map(([file, diags]) => (
          <FileGroup key={file} file={file} diagnostics={diags} activeFilePath={activeFilePath} onOpenFile={onOpenFile} onFixError={onFixError} />
        ))}
        {filtered.length === 0 && (
          <p className="text-[11px] text-[#8b949e] text-center py-6">Nenhum problema encontrado ✓</p>
        )}
      </div>
    </div>
  )
}

function FileGroup({
  file, diagnostics, activeFilePath, onOpenFile, onFixError
}: {
  file: string
  diagnostics: Diagnostic[]
  activeFilePath: string | null
  onOpenFile: (path: string, line?: number) => void
  onFixError: (error: Diagnostic) => void
}) {
  const [open, setOpen] = useState(true)
  const errors = diagnostics.filter(d => d.severity === 'error')
  const warnings = diagnostics.filter(d => d.severity === 'warning')

  return (
    <div className="border-b border-[#21262d]">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-[#161b22] text-[11px]">
        {open ? <ChevronDown className="w-3 h-3 text-[#8b949e]" /> : <ChevronRight className="w-3 h-3 text-[#8b949e]" />}
        <span className="text-[#e6edf3] truncate">{file}</span>
        <span className="text-[#8b949e] ml-1">
          ({errors.length} erros, {warnings.length} avisos)
        </span>
      </button>
      {open && (
        <div>
          {diagnostics.map((d, i) => (
            <div key={i} className="flex items-start gap-2 px-5 py-1 hover:bg-[#1c2128] text-[11px] cursor-pointer" onClick={() => onOpenFile(d.file, d.line)}>
              <span className={d.severity === 'error' ? 'text-red-400 shrink-0 mt-0.5' : 'text-yellow-400 shrink-0 mt-0.5'}>
                {d.severity === 'error' ? '⊗' : '⚠'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[#e6edf3] truncate">{d.message}</p>
                <p className="text-[#484f58] text-[10px]">
                  Ln {d.line}, Col {d.col} · {d.code}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onFixError(d) }}
                className="text-[#58a6ff] text-[10px] hover:text-[#79c0ff] shrink-0"
              >
                <Wand2 className="w-3 h-3 inline mr-0.5" />Corrigir com IA
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OutputContent() {
  const [logs, setLogs] = useState<OutputLog[]>([])
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${IDE_SERVER_URL}/health`, {
          headers: { 'X-IDE-Key': IDE_KEY },
          signal: AbortSignal.timeout(3000)
        })
        const data = await res.json()
        setLogs((prev: OutputLog[]) => {
          const category: OutputLog['category'] = data.status === 'ok' ? 'OK' : 'ERROR'
          const next: OutputLog[] = [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            category,
            message: `IDE Server ${data.status === 'ok' ? 'online' : 'offline'} · v${data.version || '?'} · uptime ${Math.round(data.uptime || 0)}s`
          }]
          return next.slice(-50)
        })
      } catch {
        setLogs((prev: OutputLog[]) => {
          const next: OutputLog[] = [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            category: 'ERROR' as const,
            message: 'IDE Server offline — rode npm run ide-server'
          }]
          return next.slice(-50)
        })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [paused])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  const categoryColor = (cat: string) => {
    switch (cat) { case 'INFO': return '#58a6ff'; case 'WARN': return '#e3b341'; case 'ERROR': return '#f85149'; case 'OK': return '#3fb950'; default: return '#8b949e' }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-[#21262d] shrink-0">
        <span className="text-[10px] text-[#8b949e]">Log de atividades</span>
        <button onClick={() => setPaused(!paused)} className="text-[10px] text-[#8b949e] hover:text-[#e6edf3]">
          {paused ? '▶ Retomar' : '⏸ Pausar'}
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] scrollbar-thin">
        {logs.map(log => (
          <div key={log.id} className="flex gap-2">
            <span className="text-[#484f58] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="shrink-0 font-medium" style={{ color: categoryColor(log.category) }}>[{log.category}]</span>
            <span className="text-[#e6edf3]">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-[#8b949e] text-center py-4">Aguardando logs...</p>}
      </div>
    </div>
  )
}

function GitContent({ gitStats }: { gitStats: GitStats }) {
  const [commitMsg, setCommitMsg] = useState('')
  const [pushAfter, setPushAfter] = useState(false)
  const [commits, setCommits] = useState<CommitLog[]>([])
  const [showCommits, setShowCommits] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLog()
  }, [])

  const fetchLog = async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/git/log?limit=8`, {
        headers: { 'X-IDE-Key': IDE_KEY }
      })
      const data = await res.json()
      setCommits(data.commits || [])
    } catch { /* ignore */ }
  }

  const stageFile = async (file: string) => {
    try {
      await fetch(`${IDE_SERVER_URL}/git/stage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ files: [file] })
      })
    } catch { /* ignore */ }
  }

  const unstageFile = async (file: string) => {
    try {
      await fetch(`${IDE_SERVER_URL}/git/unstage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ files: [file] })
      })
    } catch { /* ignore */ }
  }

  const stageAll = async () => {
    for (const f of [...gitStats.modified, ...gitStats.untracked]) await stageFile(f)
  }

  const unstageAll = async () => {
    for (const f of gitStats.staged) await unstageFile(f)
  }

  const handleCommit = async () => {
    if (!commitMsg.trim() || gitStats.staged.length === 0) return
    setLoading(true)
    try {
      await fetch(`${IDE_SERVER_URL}/git/commit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ message: commitMsg })
      })
      if (pushAfter) {
        await fetch(`${IDE_SERVER_URL}/git/push`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
          body: JSON.stringify({})
        })
      }
      setCommitMsg('')
      fetchLog()
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div className="px-3 py-1.5 border-b border-[#21262d]">
        <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">
          {gitStats.branch} ↑{gitStats.ahead} ↓{gitStats.behind}
        </span>
      </div>

      {gitStats.modified.length + gitStats.untracked.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] font-medium text-[#e6edf3]">Changes</span>
            <button onClick={stageAll} className="text-[9px] text-[#58a6ff] hover:text-[#79c0ff]">Stage All</button>
          </div>
          {[...gitStats.modified.map(p => ({ path: p, status: 'M' })), ...gitStats.untracked.map(p => ({ path: p, status: 'U' }))]
            .map(f => (
              <div key={f.path} className="flex items-center gap-2 px-3 py-0.5 hover:bg-[#1c2128] text-[11px]">
                <span className="text-[#e3b341] w-4 text-center">{f.status}</span>
                <span className="text-[#e6edf3] truncate flex-1">{f.path}</span>
                <button onClick={() => stageFile(f.path)} className="text-[#8b949e] hover:text-[#e6edf3] text-[9px]">
                  Stage ↑
                </button>
              </div>
            ))}
        </>
      )}

      {gitStats.staged.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3 py-1 mt-1">
            <span className="text-[10px] font-medium text-green-400">Staged</span>
            <button onClick={unstageAll} className="text-[9px] text-[#58a6ff]">Unstage All</button>
          </div>
          {gitStats.staged.map(p => (
            <div key={p} className="flex items-center gap-2 px-3 py-0.5 hover:bg-[#1c2128] text-[11px]">
              <span className="text-[#3fb950] w-4 text-center">A</span>
              <span className="text-[#e6edf3] truncate flex-1">{p}</span>
              <button onClick={() => unstageFile(p)} className="text-[#8b949e] hover:text-[#e6edf3] text-[9px]">Unstage ↓</button>
            </div>
          ))}
        </>
      )}

      {gitStats.staged.length + gitStats.modified.length + gitStats.untracked.length === 0 && (
        <p className="text-[11px] text-[#8b949e] text-center py-4">Working tree clean</p>
      )}

      <div className="px-3 py-1.5 border-t border-[#21262d] mt-1">
        <div className="flex items-center gap-2">
          <input
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Mensagem do commit..."
            className="flex-1 bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#1f6feb]"
          />
          <button className="p-1 rounded hover:bg-[#21262d] text-[#8b949e]" title="Gerar com IA"><Wand2 className="w-3 h-3" /></button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <label className="flex items-center gap-1 text-[10px] text-[#8b949e]">
            <input type="checkbox" checked={pushAfter} onChange={(e) => setPushAfter(e.target.checked)} />
            Push após commit
          </label>
          <button
            onClick={handleCommit}
            disabled={!commitMsg.trim() || gitStats.staged.length === 0 || loading}
            className="ml-auto px-3 py-0.5 rounded bg-green-700 text-white text-[10px] hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Commit'}
          </button>
        </div>
      </div>

      {commits.length > 0 && (
        <div className="border-t border-[#21262d] mt-1">
          <button onClick={() => setShowCommits(!showCommits)} className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left text-[10px] text-[#8b949e] hover:bg-[#161b22]">
            {showCommits ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Últimos commits
          </button>
          {showCommits && (
            <div className="px-3 pb-2 space-y-1">
              {commits.map(c => (
                <div key={c.hash} className="text-[10px]">
                  <span className="text-[#58a6ff]">{c.shortHash}</span>
                  <span className="text-[#e6edf3] ml-1.5">{c.message}</span>
                  <span className="text-[#484f58] ml-1.5">{c.author} · {relativeTime(c.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
