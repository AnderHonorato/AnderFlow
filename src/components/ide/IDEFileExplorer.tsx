"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, EyeOff, Search, FilePlus, FolderPlus, Trash2, Terminal, Copy, Pencil } from 'lucide-react'
import type { Diagnostic } from './ide-types'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.ide-trash'])

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
  const gitStatusRef = useRef<Map<string, string>>(new Map())

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
        headers: { 'X-IDE-Key': IDE_KEY }
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
    setLoading(true)
    try {
      const [treeRes] = await Promise.all([
        fetch(`${IDE_SERVER_URL}/files/list?path=.`, {
          headers: { 'X-IDE-Key': IDE_KEY }
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
  }, [fetchGitStatus, mergeGitStatus])

  useEffect(() => {
    fetchTree()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus()
    }
  }, [showSearch])

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

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
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
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
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
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
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
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
        headers: { 'Content-Type': 'application/json', 'X-IDE-Key': IDE_KEY },
        body: JSON.stringify({ path: node.path, newName })
      })
      fetchTree()
    } catch { /* ignore */ }
  }

  const handleCopyPath = (node: FileNode) => {
    navigator.clipboard.writeText(node.path).catch(() => {})
    setContextMenu(null)
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
              maxHeight: isExpanded ? `${(node.children.length + 1) * 24}px` : '0px',
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
      className="flex flex-col overflow-hidden border-r border-[#30363d]"
      style={{ gridArea: 'sidebar', background: '#0d1117' }}
    >
      <div
        className="flex items-center gap-2 px-3 shrink-0 border-b border-[#21262d]"
        style={{ height: '35px', background: '#161b22' }}
      >
        <span className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">Explorador</span>
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
        {loading && tree.length === 0 ? (
          <p className="text-[11px] text-[#484f58] text-center py-6">Carregando...</p>
        ) : visibleTree.length === 0 ? (
          <p className="text-[11px] text-[#484f58] text-center py-6">
            {searchQuery ? 'Nenhum arquivo encontrado' : 'Pasta vazia'}
          </p>
        ) : (
          visibleTree.map(node => renderNode(node, 0))
        )}
      </div>

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
