"use client"

import { useState, useCallback, useEffect } from 'react'
import { useIDEServer } from '@/hooks/useIDEServer'
import { useIDEKeyBindings } from '@/hooks/useIDEKeyBindings'
import { IDEStatusBar } from './IDEStatusBar'
import { IDEFileExplorer } from './IDEFileExplorer'
import { IDEEditor } from './IDEEditor'
import { IDEChat } from './IDEChat'
import { IDETerminal } from './IDETerminal'
import { IDEBottomBar } from './IDEBottomBar'
import { IDECommandPalette } from './IDECommandPalette'
import { IDESettings, loadSettings, DEFAULTS as DEFAULT_SETTINGS } from './IDESettings'
import { getIDEHeaders } from '@/lib/ide-workspace'
import type { Tab, FileContent, GitStats, Diagnostic, AIMode } from './ide-types'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'

const LS_KEYS = {
  openFiles: 'ide_open_files',
  activeTab: 'ide_active_tab',
  terminalOpen: 'ide_terminal_open',
  chatOpen: 'ide_chat_open',
  terminalHeight: 'ide_terminal_height',
  chatWidth: 'ide_chat_width',
  recentFiles: 'ide_recent_files',
  aiMode: 'ide_ai_mode',
}

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function saveToLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

interface IDELayoutProps {
  onClose: () => void
}

function buildGridStyle(
  sidebarOpen: boolean,
  chatOpen: boolean,
  terminalOpen: boolean,
  sidebarWidth: number,
  chatWidth: number,
  terminalHeight: number
): React.CSSProperties {
  const sidebarCol = sidebarOpen ? `${sidebarWidth}px` : '0px'
  const chatCol = chatOpen ? `${chatWidth}px` : '0px'
  const terminalRow = terminalOpen ? `${terminalHeight}px` : '0px'

  return {
    display: 'grid',
    gridTemplateRows: `28px 1fr ${terminalRow} 28px`,
    gridTemplateColumns: `${sidebarCol} 4px 1fr 4px ${chatCol}`,
    gridTemplateAreas: `
      "statusbar statusbar statusbar statusbar statusbar"
      "sidebar   sb-resize editor    ch-resize chat"
      "sidebar   sb-resize terminal  ch-resize ."
      "bottombar bottombar bottombar bottombar bottombar"
    `,
  }
}

export function IDELayout({ onClose }: IDELayoutProps) {
  const { isConnected, serverVersion, checkNow } = useIDEServer()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [chatOpen, setChatOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(200)
  const [chatWidth, setChatWidth] = useState(320)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [openFiles, setOpenFiles] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileContent | null>(null)
  const [gitBranch, setGitBranch] = useState('main')
  const [gitStats, setGitStats] = useState<GitStats>({ branch: 'main', ahead: 0, behind: 0, modified: [], staged: [], untracked: [] })
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [currentMode, setCurrentMode] = useState<AIMode>('normal')
  const [tokenCount, setTokenCount] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number } | null>(null)

  useEffect(() => {
    setChatOpen(loadFromLS(LS_KEYS.chatOpen, true))
    setTerminalOpen(loadFromLS(LS_KEYS.terminalOpen, false))
    setTerminalHeight(loadFromLS(LS_KEYS.terminalHeight, 200))
    setChatWidth(loadFromLS(LS_KEYS.chatWidth, 320))
    setOpenFiles(loadFromLS(LS_KEYS.openFiles, []))
    setActiveTabId(loadFromLS(LS_KEYS.activeTab, null))
    setCurrentMode(loadFromLS(LS_KEYS.aiMode, 'normal'))
    setSettingsState(loadSettings())
  }, [])

  useEffect(() => {
    saveToLS(LS_KEYS.openFiles, openFiles.map(f => ({ id: f.id, path: f.path, name: f.name, language: f.language, content: '', isDirty: f.isDirty, isActive: f.isActive })))
  }, [openFiles])

  useEffect(() => { saveToLS(LS_KEYS.activeTab, activeTabId) }, [activeTabId])
  useEffect(() => { saveToLS(LS_KEYS.terminalOpen, terminalOpen) }, [terminalOpen])
  useEffect(() => { saveToLS(LS_KEYS.chatOpen, chatOpen) }, [chatOpen])
  useEffect(() => { saveToLS(LS_KEYS.terminalHeight, terminalHeight) }, [terminalHeight])
  useEffect(() => { saveToLS(LS_KEYS.chatWidth, chatWidth) }, [chatWidth])
  useEffect(() => { saveToLS(LS_KEYS.aiMode, currentMode) }, [currentMode])

  const addRecentFile = useCallback((path: string) => {
    const recents: string[] = loadFromLS<string[]>(LS_KEYS.recentFiles, [])
    const next = [path, ...recents.filter(p => p !== path)].slice(0, 10)
    saveToLS(LS_KEYS.recentFiles, next)
  }, [])

  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS)

  const fetchDiagnostics = useCallback(async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/lsp/diagnostics`, {
        headers: getIDEHeaders()
      })
      if (!res.ok) return
      const data = await res.json()
      setDiagnostics(data.diagnostics || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (activeFile) {
      fetchDiagnostics()
    }
  }, [activeFile?.path, fetchDiagnostics])

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setOpenFiles(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })))
    const tab = openFiles.find(t => t.id === tabId)
    if (tab) {
      setActiveFile({ path: tab.path, content: tab.content, language: tab.language, lines: tab.content.split('\n').length })
    }
  }, [openFiles])

  const handleTabClose = useCallback((tabId: string) => {
    setOpenFiles(prev => {
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const idx = prev.findIndex(t => t.id === tabId)
        const newActive = next[Math.min(idx, next.length - 1)]
        if (newActive) {
          setActiveTabId(newActive.id)
          setActiveFile({ path: newActive.path, content: newActive.content, language: newActive.language, lines: newActive.content.split('\n').length })
        } else {
          setActiveTabId(null)
          setActiveFile(null)
        }
      }
      return next
    })
  }, [activeTabId])

  const handleOpenFile = useCallback((path: string) => {
    const name = path.split('/').pop() || path.split('\\').pop() || path
    const ext = name.includes('.') ? name.split('.').pop() || 'text' : 'text'
    const languageMap: Record<string, string> = { ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', css: 'css', json: 'json', md: 'markdown', prisma: 'prisma', sql: 'sql' }
    const language = languageMap[ext] || 'text'
    const tab: Tab = { id: path, path, name, language, content: '', isDirty: false, isActive: true }
    const exists = openFiles.find(t => t.id === tab.id)
    if (!exists) {
      setOpenFiles(prev => [...prev, tab])
    }
    setActiveTabId(tab.id)
    setActiveFile({ path: tab.path, content: tab.content, language: tab.language, lines: 0 })
    addRecentFile(path)
  }, [openFiles, addRecentFile])

  const saveCurrentFile = useCallback(() => {
    if (!activeFile || !activeTabId) return
  }, [activeFile, activeTabId])

  const closeActiveTab = useCallback(() => {
    if (activeTabId && openFiles.length > 0) {
      handleTabClose(activeTabId)
    }
  }, [activeTabId, openFiles, handleTabClose])

  const nextTab = useCallback(() => {
    if (openFiles.length < 2) return
    const idx = openFiles.findIndex(t => t.id === activeTabId)
    const next = (idx + 1) % openFiles.length
    handleTabSelect(openFiles[next].id)
  }, [openFiles, activeTabId, handleTabSelect])

  const prevTab = useCallback(() => {
    if (openFiles.length < 2) return
    const idx = openFiles.findIndex(t => t.id === activeTabId)
    const prev = (idx - 1 + openFiles.length) % openFiles.length
    handleTabSelect(openFiles[prev].id)
  }, [openFiles, activeTabId, handleTabSelect])

  useIDEKeyBindings({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenCommandsPalette: () => setCommandPaletteOpen(true),
    onSaveFile: saveCurrentFile,
    onSaveAll: () => {},
    onCloseActiveTab: closeActiveTab,
    onNextTab: nextTab,
    onPrevTab: prevTab,
    onToggleTerminal: () => setTerminalOpen(prev => !prev),
    onToggleExplorer: () => setSidebarOpen(prev => !prev),
    onToggleChat: () => setChatOpen(prev => !prev),
    onOpenSettings: () => setSettingsOpen(true),
    onNewChat: () => {},
    onPotentialUndo: () => {},
    onFocusGit: () => setTerminalOpen(true),
    onFocusProblems: () => setTerminalOpen(true),
    onRenameFile: () => {},
    onClose: () => {
      setCommandPaletteOpen(false)
      setSettingsOpen(false)
    },
  })

  const startSidebarDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarWidth
    const onMove = (ev: MouseEvent) => setSidebarWidth(Math.max(120, Math.min(500, startW + (ev.clientX - startX))))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const startChatDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = chatWidth
    const onMove = (ev: MouseEvent) => setChatWidth(Math.max(200, Math.min(600, startW - (ev.clientX - startX))))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const gridStyle = buildGridStyle(sidebarOpen, chatOpen, terminalOpen, sidebarWidth, chatWidth, terminalHeight)

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d1117] text-[#e6edf3] overflow-hidden font-sans"
         style={{ ...gridStyle, fontSize: `${settings.fontSize}px`, fontFamily: `"${settings.fontFamily}", monospace` as any }}>
      {!isConnected && (
        <div className="absolute top-7 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/30 px-3 py-1 text-[10px] text-yellow-400 z-[150] flex items-center gap-1">
          <span>⚠ IDE Server offline — rode</span>
          <code className="bg-yellow-500/10 px-1 rounded text-[10px]">npm run ide-server</code>
        </div>
      )}

      <IDEStatusBar
        onClose={onClose}
        isConnected={isConnected}
        gitBranch={gitBranch}
        gitStats={{ ahead: gitStats.ahead, behind: gitStats.behind, modified: gitStats.modified.length }}
        tokenCount={tokenCount}
        currentMode={currentMode}
        activeFileName={activeFile?.path?.split('/').pop() || activeFile?.path?.split('\\').pop() || null}
        activeFileLanguage={activeFile?.language || null}
        diagnosticsCount={{ errors: diagnostics.filter(d => d.severity === 'error').length, warnings: diagnostics.filter(d => d.severity === 'warning').length }}
      />

      {sidebarOpen && (
        <IDEFileExplorer
          onOpenFile={handleOpenFile}
          activeFilePath={activeFile?.path || null}
          diagnostics={diagnostics}
        />
      )}

      {sidebarOpen && (
        <div
          onMouseDown={startSidebarDrag}
          className="cursor-col-resize hover:bg-[#1f6feb]/50 active:bg-[#1f6feb] transition-colors z-10 shrink-0"
          style={{ gridArea: 'sb-resize', width: '4px' }}
        />
      )}

      <IDEEditor
        openFiles={openFiles}
        activeTabId={activeTabId}
        activeFile={activeFile}
        diagnostics={diagnostics}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onSendToChat={(content: string) => {}}
        onUpdateTab={(tabId: string, updates: Partial<Tab>) => {
          setOpenFiles(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t))
          if (tabId === activeTabId && updates.content !== undefined) {
            setActiveFile(prev => prev ? { ...prev, content: updates.content!, lines: updates.content!.split('\n').length } : null)
          }
        }}
      />

      {chatOpen && (
        <div
          onMouseDown={startChatDrag}
          className="cursor-col-resize hover:bg-[#1f6feb]/50 active:bg-[#1f6feb] transition-colors z-10 shrink-0"
          style={{ gridArea: 'ch-resize', width: '4px' }}
        />
      )}

      {chatOpen && (
        <IDEChat
          onToggle={() => setChatOpen(false)}
          activeFilePath={activeFile?.path}
          activeFileContent={activeFile?.content}
          onModeChange={(m) => { setCurrentMode(m) }}
          onTokenUpdate={(t) => { setTokenCount(t) }}
        />
      )}

      {terminalOpen && (
        <IDETerminal
          onToggle={() => setTerminalHeight(prev => prev >= 400 ? 200 : 400)}
          onClose={() => setTerminalOpen(false)}
          onHeightDrag={(deltaY: number) => setTerminalHeight(prev => Math.max(100, Math.min(600, prev + deltaY)))}
          diagnostics={diagnostics}
          gitStats={gitStats}
          activeFilePath={activeFile?.path || null}
          onOpenFile={(path: string, line?: number) => { handleOpenFile(path) }}
          onFixError={(error: Diagnostic) => {}}
          onUpdateDiagnostics={(diags: Diagnostic[]) => setDiagnostics(diags)}
        />
      )}

      <IDEBottomBar
        diagnostics={diagnostics}
        isConnected={isConnected}
        cursorPosition={cursorPosition}
        gitBranch={gitBranch}
        gitAhead={gitStats.ahead}
        gitBehind={gitStats.behind}
        activeFileLanguage={activeFile?.language || null}
        onGitClick={() => setTerminalOpen(true)}
        onHistoryClick={() => {}}
      />

      {commandPaletteOpen && (
        <IDECommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onOpenFile={(path: string, line?: number) => { handleOpenFile(path) }}
          onToggleTerminal={() => { setTerminalOpen(prev => !prev) }}
          onToggleChat={() => { setChatOpen(prev => !prev) }}
          onGitCommit={() => {}}
          onNewFile={() => {}}
          onSaveFile={saveCurrentFile}
          activeFilePath={activeFile?.path || null}
        />
      )}

      {settingsOpen && (
        <IDESettings onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}
