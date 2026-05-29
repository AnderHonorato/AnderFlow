"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Plus, History, X, Wrench, ChevronDown, ChevronRight,
  Check, Clipboard, Loader2, Paperclip
} from 'lucide-react'
import type { AIMode } from './ide-types'
import { SlashCommandMenu, SLASH_COMMANDS, type SlashCommand } from './SlashCommandMenu'
import { IDEAgentMode } from './IDEAgentMode'
import { loadSettings, saveSettings } from './IDESettings'

const MODEL_OPTIONS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', icon: '🧠', provider: 'DeepSeek', disabled: false },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', icon: '⚡', provider: 'DeepSeek', disabled: false },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4', icon: '🧬', provider: 'Anthropic', disabled: true },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4', icon: '💎', provider: 'Anthropic', disabled: true },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4', icon: '🍃', provider: 'Anthropic', disabled: true },
  { id: 'gpt-4o', label: 'GPT-4o', icon: '⚙️', provider: 'OpenAI', disabled: true },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', icon: '🏎️', provider: 'OpenAI', disabled: true },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', icon: '🔮', provider: 'Google', disabled: true },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', icon: '💫', provider: 'Google', disabled: true },
]

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  modeUsed?: string
}

interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  result?: unknown
  status: 'running' | 'success' | 'error'
  duration?: number
}

interface IDEChatProps {
  onToggle: () => void
  activeFileContent?: string
  activeFilePath?: string
}

const MODES: { key: AIMode; label: string; icon: string; desc: string; placeholder: string }[] = [
  { key: 'normal', label: 'Chat', icon: '💬', desc: 'Conversa livre com a IA', placeholder: 'Pergunte qualquer coisa...' },
  { key: 'programmer', label: 'Programador', icon: '👨‍💻', desc: 'Cria e edita arquivos do projeto', placeholder: 'Ex: Crie um hook useAuth em src/hooks/...' },
  { key: 'agent', label: 'Agente', icon: '🤖', desc: 'Tarefas autônomas multi-etapas', placeholder: 'Ex: Refatore todos os componentes para o novo Button...' },
  { key: 'explain', label: 'Explicar', icon: '🔍', desc: 'Explica código selecionado', placeholder: 'Selecione código no editor e clique "Abrir com IA"...' },
  { key: 'review', label: 'Revisar', icon: '📝', desc: 'Code review do arquivo ativo', placeholder: 'Revise o arquivo atual em busca de bugs...' },
  { key: 'test', label: 'Testes', icon: '🧪', desc: 'Gera testes unitários', placeholder: 'Ex: Gere testes para o componente atual...' },
]

function simpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 my-2 overflow-x-auto relative group/code"><code class="text-[12px]">${code}</code></pre>`
  )
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#21262d] text-[#e6edf3] px-1 py-0.5 rounded text-[12px]">$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

export function IDEChat({ onToggle, activeFileContent, activeFilePath }: IDEChatProps) {
  const [mode, setMode] = useState<AIMode>('programmer')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showToolLog, setShowToolLog] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [contextFiles, setContextFiles] = useState<{ name: string; content: string }[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState('')
  const [autocompleteFiles, setAutocompleteFiles] = useState<{ name: string; path: string }[]>([])
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0)
  const [activeSlashCommand, setActiveSlashCommand] = useState<SlashCommand | null>(null)
  const [selectedModel, setSelectedModel] = useState(() => loadSettings().model)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentMode = MODES.find(m => m.key === mode) || MODES[0]

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  useEffect(() => {
    const saved = localStorage.getItem(`ide_chat_${sessionId}`)
    if (saved) {
      try { setMessages(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [sessionId])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ide_chat_${sessionId}`, JSON.stringify(messages.slice(-100)))
    }
  }, [messages, sessionId])

  const allToolCalls = messages.flatMap(m => m.toolCalls || [])

  const tokenEstimate = messages.reduce((sum, m) => sum + Math.round((m.content || '').length / 3.5), 0)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    const atMatch = value.match(/@(\w*)$/)
    if (atMatch) {
      setAutocompleteQuery(atMatch[1])
      setShowAutocomplete(true)
      searchFiles(atMatch[1])
      setSlashMenuOpen(false)
    } else {
      setShowAutocomplete(false)
    }

    const slashMatch = value.match(/^\/(\S*)$/)
    if (slashMatch) {
      setSlashQuery(slashMatch[1])
      setSlashMenuOpen(true)
      setSlashSelectedIdx(0)
    } else {
      setSlashMenuOpen(false)
      setActiveSlashCommand(null)
    }

    adjustTextarea()
  }

  const adjustTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const searchFiles = async (query: string) => {
    try {
      const params = new URLSearchParams({ query, fileTypes: '.ts,.tsx,.js,.jsx,.css,.json,.prisma,.md' })
      const res = await fetch(`${IDE_SERVER_URL}/files/search?${params}`, {
        headers: { 'X-IDE-Key': IDE_KEY }
      })
      const data = await res.json()
      setAutocompleteFiles((data.results || []).map((r: any) => ({
        name: r.file.split('/').pop() || r.file,
        path: r.file
      })))
    } catch {
      setAutocompleteFiles([])
    }
  }

  const insertMention = async (file: { name: string; path: string }) => {
    setInput(prev => prev.replace(/@\w*$/, `@${file.name} `))
    setShowAutocomplete(false)
    try {
      const params = new URLSearchParams({ path: file.path })
      const res = await fetch(`${IDE_SERVER_URL}/files/read?${params}`, {
        headers: { 'X-IDE-Key': IDE_KEY }
      })
      const data = await res.json()
      if (data.content) {
        setContextFiles(prev => {
          const exists = prev.find(f => f.name === file.name)
          if (exists) return prev.map(f => f.name === file.name ? { ...f, content: data.content } : f)
          return [...prev, { name: file.name, content: data.content }]
        })
      }
    } catch { /* ignore */ }
  }

  const removeContextFile = (name: string) => {
    setContextFiles(prev => prev.filter(f => f.name !== name))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    const apiMessages = [
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: text }
    ]

    const ac = new AbortController()
    abortRef.current = ac

    try {
      const res = await fetch('/api/ide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId,
          mode,
          model: selectedModel,
          context: { files: contextFiles.map(f => ({ path: f.name, content: f.content })) }
        }),
        signal: ac.signal
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantContent = ''
      const toolCalls: ToolCall[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)

          let parsed: any
          try { parsed = JSON.parse(data) } catch { continue }

          switch (parsed.type) {
            case 'text':
              assistantContent += parsed.content
              setStreamingContent(assistantContent)
              break
            case 'tool_use':
              toolCalls.push({
                id: `tool_${Date.now()}_${toolCalls.length}`,
                name: parsed.tool,
                input: parsed.input || {},
                status: 'running',
                duration: undefined
              })
              setStreamingContent(assistantContent)
              break
            case 'tool_result':
              const tc = toolCalls.find(t => t.name === parsed.tool && t.status === 'running')
              if (tc) {
                tc.result = parsed.result
                tc.status = parsed.result?.error ? 'error' : 'success'
                tc.duration = Date.now() - new Date(tc.id.replace('tool_', '')).getTime()
              }
              setStreamingContent(assistantContent)
              break
            case 'done':
              break
          }
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        modeUsed: mode
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Erro ao processar. Verifique se o servidor IDE está rodando.',
          timestamp: new Date().toISOString()
        }])
      }
    }

    setIsStreaming(false)
    setStreamingContent('')
    abortRef.current = null
  }

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    setActiveSlashCommand(cmd)
    const placeholder = cmd.expectsArgs && cmd.argsPlaceholder ? ` ${cmd.argsPlaceholder}` : ''
    setInput(`${cmd.command}${placeholder} `)
    setSlashMenuOpen(false)
    adjustTextarea()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const filtered = SLASH_COMMANDS.filter(c => c.command.includes(slashQuery.toLowerCase()) || c.label.toLowerCase().includes(slashQuery.toLowerCase()))
        setSlashSelectedIdx(prev => Math.min(prev + 1, (filtered.length || 1) - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashSelectedIdx(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const filtered = SLASH_COMMANDS.filter(c => c.command.includes(slashQuery.toLowerCase()) || c.label.toLowerCase().includes(slashQuery.toLowerCase()))
        const display = slashQuery ? filtered : SLASH_COMMANDS
        if (display[slashSelectedIdx]) {
          handleSelectSlashCommand(display[slashSelectedIdx])
        }
        return
      }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false)
      setSlashMenuOpen(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setContextFiles([])
    setInput('')
    setIsStreaming(false)
    setStreamingContent('')
    localStorage.removeItem(`ide_chat_${sessionId}`)
  }

  const applyToFile = async (code: string) => {
    if (!activeFilePath) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ path: activeFilePath, content: code, createDirs: false })
      })
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col overflow-hidden border-l border-[#30363d]" style={{ gridArea: 'chat', background: '#0d1117' }}>
      <div className="flex items-center justify-between px-3 shrink-0 border-b border-[#21262d] bg-[#161b22]" style={{ height: '40px' }}>
        <div className="relative" ref={modeDropdownRef}>
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#21262d] text-[12px] text-[#e6edf3]"
          >
            <span>{currentMode.icon}</span>
            <span>{currentMode.label}</span>
            <ChevronDown className="w-3 h-3 text-[#8b949e]" />
          </button>
          {showModeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-50 py-1">
              {MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setShowModeDropdown(false) }}
                  className={`flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-[#1c2128] ${mode === m.key ? 'bg-[#1f6feb]/10' : ''}`}
                >
                  <span className="text-[14px] shrink-0 mt-0.5">{m.icon}</span>
                  <div>
                    <p className="text-[12px] text-[#e6edf3]">{m.label}</p>
                    <p className="text-[10px] text-[#8b949e]">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#21262d] text-[10px] text-[#58a6ff]"
          >
            {selectedModel}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showModelDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-50 py-1">
              {MODEL_OPTIONS.map(m => (
                <button
                  key={m.id}
                  disabled={m.disabled}
                  onClick={() => { if (!m.disabled) { setSelectedModel(m.id); saveSettings({ ...loadSettings(), model: m.id }); setShowModelDropdown(false) } }}
                  className={`flex items-start gap-2 w-full px-3 py-1.5 text-left ${m.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#1c2128]'} ${selectedModel === m.id ? 'bg-[#1f6feb]/10' : ''}`}
                >
                  <span className="text-[12px] shrink-0 mt-0.5">{m.icon}</span>
                  <div>
                    <p className="text-[11px] text-[#e6edf3]">{m.label}</p>
                    <p className="text-[9px] text-[#8b949e]">{m.provider}{m.disabled ? ' (sem key)' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]" title="Nova conversa">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowSessions(!showSessions)} className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]" title="Sessões">
            <History className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]" title="Fechar">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {mode === 'agent' ? (
        <IDEAgentMode
          onClose={() => setMode('programmer')}
          activeFilePath={activeFilePath || null}
          onOpenFile={(path: string) => {}}
        />
      ) : (
      <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#484f58] gap-3 py-12">
            <span className="text-3xl">{currentMode.icon}</span>
            <p className="text-[13px] text-center max-w-[200px]">
              Modo {currentMode.label} ativo. {currentMode.desc}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#1f6feb]/20 flex items-center justify-center shrink-0 mt-1 text-[12px]">
                {msg.modeUsed ? MODES.find(m => m.key === msg.modeUsed)?.icon || '🤖' : '🤖'}
              </div>
            )}
            <div className={`max-w-[85%] min-w-0 ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1f6feb] text-white rounded-br-sm'
                  : 'bg-[#161b22] border border-[#21262d] rounded-bl-sm text-[#e6edf3]'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }} />
              </div>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.toolCalls.map(tc => (
                    <ToolCallCard key={tc.id} toolCall={tc} />
                  ))}
                </div>
              )}
              <p className="text-[9px] text-[#484f58] mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-[#30363d] flex items-center justify-center shrink-0 mt-1 text-[10px] font-medium text-[#8b949e]">
                VC
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-[#1f6feb]/20 flex items-center justify-center shrink-0 mt-1 text-[12px]">
              {currentMode.icon}
            </div>
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-[#161b22] border border-[#21262d] text-[13px] leading-relaxed text-[#e6edf3]">
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(streamingContent) }} />
                <span className="inline-block w-1.5 h-4 bg-[#58a6ff] animate-pulse ml-0.5 align-middle rounded-sm" />
              </div>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-[#1f6feb]/20 flex items-center justify-center shrink-0" />
            <div className="flex items-center gap-1 px-3 py-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#8b949e] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="text-[11px] text-[#8b949e] ml-1">Processando...</span>
            </div>
          </div>
        )}
      </div>

      {allToolCalls.length > 0 && (
        <div className="border-t border-[#21262d] shrink-0">
          <button
            onClick={() => setShowToolLog(!showToolLog)}
            className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left text-[10px] text-[#8b949e] hover:bg-[#161b22]"
          >
            <Wrench className="w-3 h-3" />
            {allToolCalls.length} ferramentas usadas
            {showToolLog ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
          {showToolLog && (
            <div className="max-h-[120px] overflow-y-auto px-3 pb-1.5 space-y-0.5 scrollbar-thin">
              {allToolCalls.map(tc => (
                <div key={tc.id} className="flex items-center gap-1.5 text-[10px]">
                  <span className={tc.status === 'success' ? 'text-green-400' : tc.status === 'error' ? 'text-red-400' : 'text-[#8b949e]'}>
                    {tc.status === 'running' ? '◌' : tc.status === 'success' ? '✓' : '✗'}
                  </span>
                  <span className="text-[#58a6ff]">{tc.name}</span>
                  <span className="text-[#8b949e]">·</span>
                  <span className="text-[#8b949e] truncate">{tc.input.path as string || tc.input.query as string || tc.input.command as string || ''}</span>
                  {tc.duration && <span className="text-[#484f58] ml-auto">{tc.duration}ms</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {contextFiles.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-[#21262d] shrink-0 flex-wrap">
          {contextFiles.map(f => (
            <span key={f.name} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1f6feb]/20 text-[10px] text-[#58a6ff]">
              @{f.name}
              <button onClick={() => removeContextFile(f.name)} className="hover:text-[#e6edf3]"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          <span className="text-[9px] text-[#484f58] ml-auto">~{tokenEstimate}k tokens</span>
        </div>
      )}

      <div className="p-2 shrink-0">
        <div className="relative bg-[#161b22] border border-[#21262d] rounded-xl">
          <SlashCommandMenu
            isOpen={slashMenuOpen}
            query={slashQuery}
            onSelect={handleSelectSlashCommand}
            onClose={() => setSlashMenuOpen(false)}
            selectedIdx={slashSelectedIdx}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none px-3 pt-2.5 pb-10 text-[13px] text-[#e6edf3] placeholder-[#484f58] leading-relaxed scrollbar-thin"
          />
          {showAutocomplete && autocompleteFiles.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl max-h-[180px] overflow-y-auto z-50">
              {autocompleteFiles.map(f => (
                <button
                  key={f.path}
                  onClick={() => insertMention(f)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-[#1c2128] text-[11px]"
                >
                  <span className="text-[#8b949e] truncate">{f.path}</span>
                </button>
              ))}
            </div>
          )}
          <div className="absolute bottom-1.5 left-3 right-3 flex items-center gap-1.5">
            <button className="p-1 rounded hover:bg-[#21262d] text-[#8b949e]" title="Anexar arquivo">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] text-[#484f58] mx-auto">~{tokenEstimate}k / 200k</span>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-1.5 rounded-lg bg-[#1f6feb] text-white hover:bg-[#388bfd] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden border-l-2 border-[#388bfd]" style={{ background: '#161b22' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-[11px]"
      >
        <Wrench className="w-3 h-3 text-[#58a6ff]" />
        <span className="text-[#e6edf3]">Usando {toolCall.name}</span>
        {expanded ? <ChevronDown className="w-3 h-3 text-[#8b949e] ml-auto" /> : <ChevronRight className="w-3 h-3 text-[#8b949e] ml-auto" />}
        <span className={toolCall.status === 'running' ? 'text-yellow-400 animate-spin' : toolCall.status === 'success' ? 'text-green-400' : toolCall.status === 'error' ? 'text-red-400' : 'text-[#8b949e]'}>
          {toolCall.status === 'running' ? <Loader2 className="w-3 h-3" /> : toolCall.status === 'success' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2 space-y-1">
          <p className="text-[10px] text-[#8b949e]">Parâmetros:</p>
          <pre className="text-[10px] text-[#e6edf3] bg-[#0d1117] rounded p-1.5 overflow-x-auto">
            {JSON.stringify(toolCall.input, null, 2)}
          </pre>
          {toolCall.result !== undefined && toolCall.result !== null && (
            <>
              <p className="text-[10px] text-[#8b949e] mt-1">Resultado:</p>
              <pre className="text-[10px] text-[#e6edf3] bg-[#0d1117] rounded p-1.5 overflow-x-auto max-h-[120px]">
                {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}
