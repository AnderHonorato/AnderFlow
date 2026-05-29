"use client"

import { GitBranch, Bell } from 'lucide-react'
import type { Diagnostic } from './ide-types'

interface IDEBottomBarProps {
  diagnostics: Diagnostic[]
  isConnected: boolean
  cursorPosition: { line: number; col: number } | null
  gitBranch: string
  gitAhead: number
  gitBehind: number
  activeFileLanguage: string | null
  onGitClick: () => void
  onHistoryClick: () => void
}

export function IDEBottomBar({
  diagnostics,
  cursorPosition,
  gitBranch,
  gitAhead,
  gitBehind,
  activeFileLanguage,
  onGitClick,
  onHistoryClick
}: IDEBottomBarProps) {
  const errors = diagnostics.filter(d => d.severity === 'error').length
  const warnings = diagnostics.filter(d => d.severity === 'warning').length

  return (
    <div
      className="flex items-center justify-between px-3 text-[11px] select-none text-white"
      style={{ gridArea: 'bottombar', background: '#1f6feb' }}
    >
      <div className="flex items-center gap-0 min-w-0">
        <button
          onClick={onGitClick}
          className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          title="Abrir painel Git"
        >
          <GitBranch className="w-3 h-3" />
          <span>{gitBranch}</span>
          <span className="opacity-70">↑{gitAhead} ↓{gitBehind}</span>
        </button>
      </div>

      <div className="flex items-center gap-0">
        {errors > 0 || warnings > 0 ? (
          <span>
            {errors > 0 && <span>⊗ {errors} erros</span>}
            {errors > 0 && warnings > 0 && <span>  </span>}
            {warnings > 0 && <span>⚠ {warnings} avisos</span>}
          </span>
        ) : (
          <span className="opacity-70">✓ Sem problemas</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors" title="Selecionar linguagem">
          {activeFileLanguage || 'TypeScript'}
        </button>
        <span>UTF-8</span>
        {cursorPosition ? (
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        ) : (
          <span>Ln 1, Col 1</span>
        )}
        <button
          onClick={onHistoryClick}
          className="hover:bg-white/10 px-1 py-0.5 rounded transition-colors"
          title="Historico de notificacoes"
        >
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
