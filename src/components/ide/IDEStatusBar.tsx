"use client"

import { ArrowLeft, GitBranch, Circle } from 'lucide-react'

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  normal: { label: '💬 Normal', color: '#8b949e' },
  programmer: { label: '👨‍💻 Programador', color: '#58a6ff' },
  agent: { label: '🤖 Agente', color: '#3fb950' },
  explain: { label: '📖 Explicar', color: '#d2a8ff' },
  review: { label: '🔍 Review', color: '#f0883e' },
  test: { label: '🧪 Testes', color: '#db6d28' }
}

interface IDEStatusBarProps {
  onClose: () => void
  isConnected: boolean
  gitBranch: string
  gitStats: { ahead: number; behind: number; modified: number }
  tokenCount: number
  currentMode: string
  activeFileName: string | null
  activeFileLanguage: string | null
  diagnosticsCount: { errors: number; warnings: number }
}

function formatTokens(count: number): string {
  if (count >= 1000) return `~${(count / 1000).toFixed(1)}k`
  return String(count)
}

export function IDEStatusBar({
  onClose,
  isConnected,
  gitBranch,
  gitStats,
  tokenCount,
  currentMode,
  activeFileName,
  activeFileLanguage,
  diagnosticsCount
}: IDEStatusBarProps) {
  const mode = MODE_LABELS[currentMode] || MODE_LABELS.normal

  return (
    <div
      className="flex items-center justify-between px-3 text-[11px] select-none border-b border-[#21262d] font-mono"
      style={{ gridArea: 'statusbar', background: '#161b22' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          title="Voltar para IA"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[#8b949e]">|</span>
        <span className="text-[#58a6ff] text-[11px] font-medium">ANDERFLOW IDE</span>
        <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 font-sans font-medium">BETA</span>
      </div>

      <div className="flex items-center gap-2 text-[#8b949e] min-w-0">
        {activeFileName && (
          <>
            <span className="text-[#e6edf3] truncate">{activeFileName}</span>
            <span>·</span>
            <span>{activeFileLanguage || 'text'}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`}
          title={isConnected ? 'localhost:3002' : 'Servidor offline — rode npm run ide-server'}
        >
          <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
          {isConnected ? 'IDE Server' : 'Offline'}
        </span>
        <span className="text-[#8b949e]">|</span>
        <span className="flex items-center gap-1 text-[#8b949e]">
          <GitBranch className="w-3 h-3" />
          {gitBranch}
        </span>
        <span className="text-[#8b949e]">|</span>
        <span className={diagnosticsCount.errors > 0 ? 'text-red-400' : 'text-[#8b949e]'}>
          ⊗ {diagnosticsCount.errors}
        </span>
        <span className="text-[#8b949e]">|</span>
        <span className="font-sans" style={{ color: mode.color }}>
          {mode.label}
        </span>
        <span className="text-[#8b949e]">|</span>
        <span className="text-[#8b949e]">{formatTokens(tokenCount)} tokens</span>
      </div>
    </div>
  )
}
