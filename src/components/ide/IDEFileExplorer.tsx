"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, EyeOff, Search, FilePlus, FolderPlus, Trash2, Terminal, Copy, Pencil, FolderOpen, Check, Plus, X } from 'lucide-react'
import type { Diagnostic } from './ide-types'
import { setWorkspaceRoot, getIDEHeaders } from '@/lib/ide-workspace'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.ide-trash'])

interface Workspace {
  id: string
  name: string
  rootPath: string
}

const WS_KEY = 'ide_workspaces'
const WS_ACTIVE_KEY = 'ide_active_workspace_id'

function loadWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(WS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveWorkspaces(workspaces: Workspace[]) {
  try { localStorage.setItem(WS_KEY, JSON.stringify(workspaces)) } catch { /* ignore */ }
}

function loadActiveWorkspaceId(): string | null {
  try { return localStorage.getItem(WS_ACTIVE_KEY) } catch { return null }
}

function saveActiveWorkspaceId(id: string | null) {
  try {
    if (id) localStorage.setItem(WS_ACTIVE_KEY, id)
    else localStorage.removeItem(WS_ACTIVE_KEY)
  } catch { /* ignore */ }
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  icon: string
  size: number
  modified: string
  language?: string
  children?: FileNode[]
  gitStatus?: 'M' | 'A' | 'U' | 'D'
  errorCount?: number
  isOpen?: boolean
}

interface ContextMenuState {
  x: number
  y: number
  node: FileNode
}

interface IDEFileExplorerProps {
  onOpenFile: (path: string) => void
  activeFilePath: string | null
  diagnostics: Diagnostic[]
}

const FILE_ICONS: Record<string, string> = {
  tsx:   '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#2563eb"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="7" font-weight="bold">T</text></svg>',
  ts:    '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#3178c6"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">TS</text></svg>',
  js:    '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#f0db4f"/><text x="8" y="11.5" text-anchor="middle" fill="#323330" font-size="6" font-weight="bold">JS</text></svg>',
  json:  '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#f5a623"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">{"}</text></svg>',
  css:   '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#1572b6"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6" font-weight="bold">#</text></svg>',
  md:    '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#42a5f5"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="5" font-weight="bold">MD</text></svg>',
  prisma:'<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#0c344b"/><text x="8" y="11.5" text-anchor="middle" fill="#5a67d8" font-size="5" font-weight="bold">PR</text></svg>',
  env:   '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#ecd540"/><text x="8" y="11.5" text-anchor="middle" fill="#333" font-size="5" font-weight="bold">ENV</text></svg>',
  image: '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#8b5cf6"/><text x="8" y="11.5" text-anchor="middle" fill="white" font-size="6">img</text></svg>',
}

function getFileIcon(ext: string): string {
  return FILE_ICONS[ext] || '<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1.5" fill="#484f58"/></svg>'
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot === -1) return ''
  const ext = name.substring(dot + 1).toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  return ext
}

function gitStatusColor(status: string): string {
  switch (status) {
    case 'M': return '#e3b341'
    case 'A': return '#3fb950'
    case 'U': return '#7ee787'
    case 'D': return '#f85149'
    default: return '#8b949e'
  }
}

function countDiagnosticsInDir(node: FileNode, diagnostics: Diagnostic[]): number {
  let count = 0
  const prefix = node.path.replace(/\\/g, '/')
  for (const d of diagnostics) {
    if (d.file.startsWith(prefix + '/') || d.file === prefix) count++
  }
  return count
}

function flatDiagnosticsMap(diagnostics: Diagnostic[]): Map<string, { errors: number; warnings: number }> {
  const map = new Map<string, { errors: number; warnings: number }>()
  for (const d of diagnostics) {
    const entry = map.get(d.file) || { errors: 0, warnings: 0 }
    if (d.severity === 'error') entry.errors++
    else entry.warnings++
    map.set(d.file, entry)
  }
  return map
}

export function IDEFileExplorer({ onOpenFile, activeFilePath, diagnostics }: IDEFileExplorerProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [hideIgnored, setHideIgnored] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const workspaceDropdownRef = useRef<HTMLDivElement>(null)
  const gitStatusRef = useRef<Map<string, string>>(new Map())

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)
  const [newWorkspacePath, setNewWorkspacePath] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [workspaceCtxMenu, setWorkspaceCtxMenu] = useState<{ x: number; y: number; ws: Workspace } | null>(null)

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null

  useEffect(() => {
    setWorkspaces(loadWorkspaces())
    setActiveWorkspaceId(loadActiveWorkspaceId())
  }, [])

  const diagMap = flatDiagnosticsMap(diagnostics)

  const filterTree = useCallback((nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes
    const lower = query.toLowerCase()
    return nodes.reduce<FileNode[]>((acc, node) => {
      const nameMatch = node.name.toLowerCase().includes(lower)
      const filteredChildren = node.children ? filterTree(node.children, query) : undefined
      if (nameMatch || (filteredChildren && filteredChildren.length > 0)) {
        acc.push({ ...node, children: filteredChildren || node.children, isOpen: true })
      }
      return acc
    }, [])
  }, [])

  const visibleTree = searchQuery ? filterTree(tree, searchQuery) : tree

  const fetchGitStatus = useCallback(async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/git/status`, {
        headers: getIDEHeaders()
      })
      if (!res.ok) return
      const data = await res.json()
      const map = new Map<string, string>()
      for (const f of data.staged || []) map.set(f, 'A')
      for (const f of data.unstaged || []) map.set(f, 'M')
      for (const f of data.untracked || []) map.set(f, 'U')
      gitStatusRef.current = map
    } catch { /* ignore */ }
  }, [])

  const mergeGitStatus = useCallback((nodes: FileNode[]): FileNode[] => {
    const gs = gitStatusRef.current
    return nodes.map(node => {
      const relPath = node.path.replace(/\\/g, '/')
      const status = gs.get(relPath) || gs.get('/' + relPath)
      const children = node.children ? mergeGitStatus(node.children) : node.children
      return { ...node, children, gitStatus: status as FileNode['gitStatus'] }
    })
  }, [])

  const fetchTree = useCallback(async () => {
    if (!activeWorkspaceId || !activeWorkspace) return
    setLoading(true)
    try {
      const root = activeWorkspace?.rootPath
      const params = new URLSearchParams({ path: '.' })
      if (root) params.set('root', root)
      const [treeRes] = await Promise.all([
        fetch(`${IDE_SERVER_URL}/files/list?${params}`, {
          headers: getIDEHeaders()
        }),
        fetchGitStatus()
      ])

      if (!treeRes.ok) return
      const data = await treeRes.json()
      let nodes: FileNode[] = data.tree || []

      nodes = mergeGitStatus(nodes)

      const autoExpand: Record<string, boolean> = {}
      setTimeout(() => {
        function expandNodes(ns: FileNode[], depth: number) {
          for (const n of ns) {
            if (n.type === 'directory') {
              if (depth <= 1 || n.name === 'src' || n.name === 'app' || n.name === 'components') {
                autoExpand[n.path] = true
              }
              if (n.children) expandNodes(n.children, depth + 1)
            }
          }
        }
        expandNodes(nodes, 0)
        setExpanded(autoExpand)
      }, 0)

      setTree(nodes)
    } catch { /* ignore */ }
    setLoading(false)
  }, [activeWorkspaceId, fetchGitStatus, mergeGitStatus])

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchTree()
    }
  }, [activeWorkspaceId, fetchTree])

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus()
    }
  }, [showSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setShowWorkspaceDropdown(false)
      }
      setContextMenu(null)
      setWorkspaceCtxMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    saveWorkspaces(workspaces)
  }, [workspaces])

  useEffect(() => {
    saveActiveWorkspaceId(activeWorkspaceId)
    setWorkspaceRoot(activeWorkspace?.rootPath || null)
  }, [activeWorkspaceId, activeWorkspace])

  const handleSelectWorkspace = (ws: Workspace) => {
    setActiveWorkspaceId(ws.id)
    setShowWorkspaceDropdown(false)
  }

  const handleCreateWorkspace = () => {
    const path = newWorkspacePath.trim()
    const name = newWorkspaceName.trim() || path.split(/[\\/]/).pop() || path
    if (!path) return
    const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const ws: Workspace = { id, name, rootPath: path }
    const next = [...workspaces, ws]
    setWorkspaces(next)
    setActiveWorkspaceId(id)
    setShowNewWorkspace(false)
    setNewWorkspacePath('')
    setNewWorkspaceName('')
    setShowWorkspaceDropdown(false)
  }

  const handleDeleteWorkspace = (id: string, e?: React.MouseEvent | any) => {
    e?.stopPropagation?.()
    const next = workspaces.filter(w => w.id !== id)
    setWorkspaces(next)
    if (activeWorkspaceId === id) {
      const newActive = next.length > 0 ? next[0].id : null
      setActiveWorkspaceId(newActive)
      if (!newActive) {
        setTree([])
        setLoading(false)
      }
    }
    setShowWorkspaceDropdown(false)
  }

  const handleBrowseFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' })
        setNewWorkspaceName(dirHandle.name)
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
    }
  }

  const handleCloseWorkspace = () => {
    setActiveWorkspaceId(null)
    setTree([])
    setLoading(false)
    setShowWorkspaceDropdown(false)
  }

  const handleWorkspaceContextMenu = (e: React.MouseEvent, ws: Workspace) => {
    e.preventDefault()
    e.stopPropagation()
    setWorkspaceCtxMenu({ x: e.clientX, y: e.clientY, ws })
  }

  const toggleFolder = (nodePath: string) => {
    setExpanded(prev => ({ ...prev, [nodePath]: !prev[nodePath] }))
  }

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  const handleOpenFile = (node: FileNode) => {
    onOpenFile(node.path)
  }

  const handleDoubleClickFile = (node: FileNode) => {
    onOpenFile(node.path)
  }

  const handleNewFile = async (parentNode: FileNode) => {
    const name = prompt('Nome do arquivo:')
    if (!name) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/create`, {
        method: 'POST',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ path: `${parentNode.path}/${name}`, type: 'file' })
      })
      fetchTree()
    } catch { /* ignore */ }
  }

  const handleNewFolder = async (parentNode: FileNode) => {
    const name = prompt('Nome da pasta:')
    if (!name) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/create`, {
        method: 'POST',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ path: `${parentNode.path}/${name}`, type: 'dir' })
      })
      fetchTree()
    } catch { /* ignore */ }
  }

  const handleDelete = async (node: FileNode) => {
    if (!confirm(`Deletar "${node.name}"?`)) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/delete`, {
        method: 'DELETE',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ path: node.path })
      })
      fetchTree()
    } catch { /* ignore */ }
  }

  const handleRename = async (node: FileNode) => {
    const newName = prompt('Novo nome:', node.name)
    if (!newName || newName === node.name) return
    try {
      await fetch(`${IDE_SERVER_URL}/files/rename`, {
        method: 'POST',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ path: node.path, newName })
      })
      fetchTree()
    } catch { /* ignore */ }
  }

  const handleCopyPath = (node: FileNode) => {
    navigator.clipboard.writeText(node.path).catch(() => {})
    setContextMenu(null)
  }

  const countVisibleChildren = (nodes: FileNode[]): number => {
    let count = 0
    for (const n of nodes) {
      count += 1
      if (n.type === 'directory' && expanded[n.path] && n.children) {
        count += countVisibleChildren(n.children)
      }
    }
    return count
  }

  const renderNode = (node: FileNode, depth: number) => {
    const isDir = node.type === 'directory'
    const isExpanded = !!expanded[node.path]
    const isSkipDir = SKIP_DIRS.has(node.name)
    const isActive = activeFilePath === node.path
    const ext = getExt(node.name)
    const diag = diagMap.get(node.path)
    const errorCount = diag ? diag.errors + diag.warnings : (node.errorCount || 0)
    const paddingLeft = depth * 12

    if (hideIgnored && isSkipDir) return null

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer select-none text-[13px] hover:bg-[#1c2128] group ${
            isActive ? 'bg-[#1f6feb]/20' : ''
          } ${isSkipDir ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => isDir ? toggleFolder(node.path) : handleOpenFile(node)}
          onDoubleClick={() => !isDir && handleDoubleClickFile(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {isDir ? (
            <span className="shrink-0 text-[#8b949e]">
              {isExpanded ? (
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor"><path d="M4.5 3L10 8l-5.5 5V3z"/></svg>
              ) : (
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor"><path d="M6 4l5 4-5 4V4z"/></svg>
              )}
            </span>
          ) : (
            <span
              className="shrink-0 w-3.5 h-3.5 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: getFileIcon(ext) }}
            />
          )}

          <span className="shrink-0 text-[#8b949e]">
            {(() => {
              if (!isDir) return null
              if (isExpanded) {
                return <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="#54aeff"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H9.5a.25.25 0 01-.2-.1l-.9-1.2c-.33-.44-.85-.7-1.4-.7H1.75z"/></svg>
              }
              return <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="#54aeff"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5l-.9-1.2c-.33-.44-.85-.7-1.4-.7H1.75z"/></svg>
            })()}
          </span>

          <span className="truncate min-w-0 flex-1 text-[#e6edf3]">
            {node.name}
          </span>

          <span className="flex items-center gap-1 shrink-0 ml-auto">
            {node.gitStatus && (
              <span className="text-[11px] font-bold" style={{ color: gitStatusColor(node.gitStatus) }}>
                {node.gitStatus}
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1 rounded">
                {errorCount}
              </span>
            )}
          </span>
        </div>

        {isDir && isExpanded && node.children && (
          <div
            className="overflow-hidden"
            style={{
              maxHeight: isExpanded ? `${countVisibleChildren(node.children) * 24}px` : '0px',
              transition: 'max-height 0.2s ease-in-out'
            }}
          >
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden border-r border-[#30363d] relative"
      style={{ gridArea: 'sidebar', background: '#0d1117' }}
    >
      <div
        className="flex items-center gap-2 px-3 shrink-0 border-b border-[#21262d]"
        style={{ height: '35px', background: '#161b22' }}
      >
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center gap-1.5 text-[11px] text-[#e6edf3] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#21262d] max-w-[160px]"
            title={activeWorkspace?.rootPath || 'Selecionar espaço de trabalho'}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#8b949e]" />
            <span className="truncate">{activeWorkspace?.name || 'Espaços de Trabalho'}</span>
            <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 shrink-0 text-[#8b949e]" fill="currentColor"><path d="M8 10L3 5h10L8 10z"/></svg>
          </button>

          {showWorkspaceDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-50 py-1">
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  onContextMenu={(e) => handleWorkspaceContextMenu(e, ws)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] cursor-pointer ${
                    ws.id === activeWorkspaceId
                      ? 'bg-[#1f6feb]/20 text-[#58a6ff]'
                      : 'text-[#e6edf3] hover:bg-[#1c2128]'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectWorkspace(ws) }}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#8b949e]" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{ws.name}</div>
                    <div className="text-[9px] text-[#484f58] truncate">{ws.rootPath}</div>
                  </div>
                  {ws.id === activeWorkspaceId && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#58a6ff]" />
                  )}
                  <button
                    onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                    className="p-0.5 rounded hover:bg-red-500/20 text-[#8b949e] hover:text-red-400 shrink-0"
                    title="Remover da lista (não apaga arquivos)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {activeWorkspaceId && (
                <button
                  onClick={handleCloseWorkspace}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#e6edf3]"
                >
                  <X className="w-3.5 h-3.5" />
                  Fechar Espaço de Trabalho
                </button>
              )}
              {workspaces.length > 0 && (
                <div className="my-1 border-t border-[#21262d]" />
              )}

              <button
                onClick={() => { setShowNewWorkspace(true); setShowWorkspaceDropdown(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[12px] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#e6edf3]"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Espaço de Trabalho
              </button>

              {workspaceCtxMenu && (
                <div
                  className="fixed z-[300] bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 min-w-[180px] text-[12px]"
                  style={{ left: workspaceCtxMenu.x, top: workspaceCtxMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { handleSelectWorkspace(workspaceCtxMenu.ws); setWorkspaceCtxMenu(null) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#58a6ff]" />
                    Abrir
                  </button>
                  <button
                    onClick={() => { handleDeleteWorkspace(workspaceCtxMenu.ws.id, {} as any); setWorkspaceCtxMenu(null) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-red-400 hover:bg-[#1c2128]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover da lista
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />
        {showSearch && (
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar arquivos..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#1f6feb]"
          />
        )}
        <button
          onClick={() => { setShowSearch(!showSearch); if (!showSearch) setSearchQuery('') }}
          className={`p-1 rounded hover:bg-[#30363d] transition-colors ${showSearch ? 'text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
          title="Buscar"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setHideIgnored(!hideIgnored)}
          className={`p-1 rounded hover:bg-[#30363d] transition-colors ${hideIgnored ? 'text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
          title="Toggle gitignore"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={fetchTree}
          className="p-1 rounded text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3] transition-colors"
          title="Recarregar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {!activeWorkspaceId ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10">
            <FolderOpen className="w-8 h-8 text-[#30363d] mb-3" />
            <p className="text-[12px] text-[#8b949e] mb-1">Nenhum espaço de trabalho</p>
            <p className="text-[10px] text-[#484f58] mb-3">Abra uma pasta para começar</p>
            <button
              onClick={() => setShowNewWorkspace(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1f6feb] text-white text-[11px] hover:bg-[#1f6feb]/80 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Abrir Pasta
            </button>
          </div>
        ) : loading && tree.length === 0 ? (
          <p className="text-[11px] text-[#484f58] text-center py-6">Carregando...</p>
        ) : visibleTree.length === 0 ? (
          <p className="text-[11px] text-[#484f58] text-center py-6">
            {searchQuery ? 'Nenhum arquivo encontrado' : 'Pasta vazia'}
          </p>
        ) : (
          visibleTree.map(node => renderNode(node, 0))
        )}
      </div>

      {showNewWorkspace && (
        <div className="absolute inset-0 z-[210] flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
              <span className="text-[13px] font-medium text-[#e6edf3]">Novo Espaço de Trabalho</span>
              <button
                onClick={() => { setShowNewWorkspace(false); setNewWorkspacePath(''); setNewWorkspaceName('') }}
                className="text-[#8b949e] hover:text-[#e6edf3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] text-[#8b949e] block mb-1">Caminho absoluto da pasta</label>
                <div className="flex gap-2">
                  <input
                    value={newWorkspacePath}
                    onChange={(e) => setNewWorkspacePath(e.target.value)}
                    placeholder="Ex: C:\Projetos\meu-app"
                    className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[12px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#1f6feb]"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace() }}
                  />
                  {'showDirectoryPicker' in window && (
                    <button
                      onClick={handleBrowseFolder}
                      className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#21262d] text-[#e6edf3] text-[12px] hover:bg-[#30363d] border border-[#30363d] shrink-0"
                      title="Seleciona a pasta para preencher o nome automaticamente"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#58a6ff]" />
                      Procurar
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-[#484f58] mt-1">Use o botão Procurar para preencher o nome. O caminho precisa ser absoluto (ex: C:\Projetos\meu-app).</p>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e] block mb-1">Nome (opcional)</label>
                <input
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Nome para identificar o projeto"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[12px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#1f6feb]"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace() }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#21262d]">
              <button
                onClick={() => { setShowNewWorkspace(false); setNewWorkspacePath(''); setNewWorkspaceName('') }}
                className="px-3 py-1.5 rounded text-[12px] text-[#8b949e] hover:bg-[#21262d]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspacePath.trim()}
                className="px-4 py-1.5 rounded bg-[#1f6feb] text-white text-[12px] hover:bg-[#1f6feb]/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[200] bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 min-w-[200px] text-[12px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { handleNewFile(contextMenu.node); setContextMenu(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#8b949e]" />
            Novo Arquivo
          </button>
          <button
            onClick={() => { handleNewFolder(contextMenu.node); setContextMenu(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#8b949e]" />
            Nova Pasta
          </button>
          <div className="my-1 border-t border-[#21262d]" />
          <button
            onClick={() => { handleRename(contextMenu.node); setContextMenu(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
          >
            <Pencil className="w-3.5 h-3.5 text-[#8b949e]" />
            Renomear (F2)
          </button>
          <button
            onClick={() => { handleDelete(contextMenu.node); setContextMenu(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-red-400 hover:bg-[#1c2128]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deletar
          </button>
          <div className="my-1 border-t border-[#21262d]" />
          <button
            onClick={() => handleCopyPath(contextMenu.node)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
          >
            <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
            Copiar Caminho Relativo
          </button>
          <button
            onClick={() => setContextMenu(null)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-[#e6edf3] hover:bg-[#1c2128]"
          >
            <Terminal className="w-3.5 h-3.5 text-[#8b949e]" />
            Abrir Terminal Aqui
          </button>
        </div>
      )}
    </div>
  )
}
