"use client"

import { useEffect } from 'react'

interface KeyBindingHandlers {
  onOpenCommandPalette: () => void
  onOpenCommandsPalette: () => void
  onSaveFile: () => void
  onSaveAll: () => void
  onCloseActiveTab: () => void
  onNextTab: () => void
  onPrevTab: () => void
  onToggleTerminal: () => void
  onToggleExplorer: () => void
  onToggleChat: () => void
  onOpenSettings: () => void
  onNewChat: () => void
  onPotentialUndo: () => void
  onFocusGit: () => void
  onFocusProblems: () => void
  onRenameFile: () => void
  onClose: () => void
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    const isChatInput = (el as HTMLElement).closest('[data-ide-input]')
    if (isChatInput && tag === 'textarea') return false
    return true
  }
  return false
}

export function useIDEKeyBindings(handlers: KeyBindingHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      if (e.key === 'Escape') {
        handlers.onClose()
        return
      }

      if (isInputFocused() && !ctrl && e.key !== 'F2') return

      if (ctrl && shift && e.key === 'P') { e.preventDefault(); handlers.onOpenCommandsPalette(); return }
      if (ctrl && e.key === 'p') { e.preventDefault(); handlers.onOpenCommandPalette(); return }

      if (ctrl && shift && e.key === 'S') { e.preventDefault(); handlers.onSaveAll(); return }
      if (ctrl && e.key === 's') { e.preventDefault(); handlers.onSaveFile(); return }

      if (ctrl && e.key === 'w') { e.preventDefault(); handlers.onCloseActiveTab(); return }

      if (ctrl && shift && e.code === 'Tab') { e.preventDefault(); handlers.onPrevTab(); return }
      if (ctrl && e.code === 'Tab') { e.preventDefault(); handlers.onNextTab(); return }

      if (ctrl && e.key === '`') { e.preventDefault(); handlers.onToggleTerminal(); return }

      if (ctrl && e.key === 'b') { e.preventDefault(); handlers.onToggleExplorer(); return }

      if (ctrl && shift && e.key === 'X') { e.preventDefault(); handlers.onToggleChat(); return }

      if (ctrl && e.key === ',') { e.preventDefault(); handlers.onOpenSettings(); return }

      if (ctrl && e.key === 'l') { e.preventDefault(); handlers.onNewChat(); return }

      if (ctrl && shift && e.key === 'G') { e.preventDefault(); handlers.onFocusGit(); return }
      if (ctrl && shift && e.key === 'M') { e.preventDefault(); handlers.onFocusProblems(); return }

      if (ctrl && e.key === 'z') { e.preventDefault(); handlers.onPotentialUndo(); return }

      if (e.key === 'F2') { e.preventDefault(); handlers.onRenameFile(); return }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
