import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { exec, spawn, ChildProcess } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as checkpoint from './checkpoint'
import * as taskQueue from './task-queue'

const ROOT_PATH = path.resolve(process.env.IDE_ROOT_PATH || process.cwd())
const PORT = parseInt(process.env.IDE_PORT || '3002', 10)
const SECRET_KEY = process.env.FS_SECRET_KEY || 'anderflow-ide-dev-key'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const LOG_FILE = path.join(ROOT_PATH, 'server', 'ide.log')
const DB_PATH = path.join(ROOT_PATH, 'server', 'ide.db')
const TRASH_DIR = path.join(ROOT_PATH, '.ide-trash')
const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001']
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 100

const ALLOWED_COMMANDS = [
  'npm', 'npx', 'node', 'git', 'ls', 'cat', 'echo', 'mkdir', 'cp', 'mv',
  'tsc', 'prisma', 'tsx', 'curl', 'dir', 'type', 'find', 'findstr'
]

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//, /format/, /shutdown/, /reboot/, /sudo/, /chmod\s+777/,
  /del\s+\/f\s+\/s/, /rd\s+\/s/, /Format-Volume/, /Stop-Computer/
]

const FILE_ICONS: Record<string, string> = {
  '.ts': '📘', '.tsx': '⚛️', '.js': '📒', '.jsx': '⚛️',
  '.css': '🎨', '.scss': '🎨', '.html': '🌐', '.json': '📋',
  '.md': '📝', '.yml': '⚙️', '.yaml': '⚙️', '.env': '🔒',
  '.gitignore': '🙈', '.prisma': '💎', '.sql': '🗄️',
  '.svg': '🖼️', '.png': '🖼️', '.jpg': '🖼️',
  '.test.ts': '🧪', '.spec.ts': '🧪', '.d.ts': '📄',
}

const FILE_TEMPLATES: Record<string, string> = {
  'react-component': `import React from 'react'

interface Props {}

export function ComponentName({}: Props) {
  return <div>ComponentName</div>
}
`,
  'api-route': `import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json({ success: true, data: body })
}
`,
  'prisma-model': `model ModelName {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`,
  'hook': `import { useState, useEffect } from 'react'

export function useHookName() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // init
  }, [])

  return { data }
}
`,
  'util': `export function utilName(...args: unknown[]) {
  // implementation
}
`,
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
}

interface DiagError {
  file: string
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
  source: 'tsc' | 'eslint'
}

interface SymbolInfo {
  name: string
  kind: string
  line: number
  column: number
}

interface ActiveProcess {
  id: string
  command: string
  pid: number
  startTime: string
  status: 'running' | 'killed' | 'done'
  child: ChildProcess
}

const activeProcesses = new Map<string, ActiveProcess>()
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const operationStates = new Map<string, { name: string; aiPrompt?: string }>()

function autoCheckpoint(req: Request, filePath: string, files?: string[]) {
  const operationId = req.headers['x-checkpoint-operation-id'] as string
  if (!operationId) return

  const name = req.headers['x-checkpoint-name'] as string || 'Auto checkpoint'
  const aiPrompt = req.headers['x-checkpoint-prompt'] as string

  const targetFiles = files || [filePath]

  try {
    checkpoint.getOrCreateGroupCheckpoint(operationId, name, ROOT_PATH, { aiPrompt, filePaths: targetFiles })
  } catch { /* non-blocking */ }
}

let db: Database.Database
let configData: Record<string, unknown> = {
  rootPath: ROOT_PATH,
  allowedCommands: ALLOWED_COMMANDS,
  maxFileSize: MAX_FILE_SIZE,
  theme: 'dark',
  version: '1.0.0'
}

function log(level: string, msg: string, meta?: unknown) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [${level.toUpperCase()}] ${msg}${meta ? ' | ' + JSON.stringify(meta) : ''}\n`
  fs.appendFileSync(LOG_FILE, line)
}

function isPathSafe(targetPath: string, effectiveRoot: string = ROOT_PATH): boolean {
  const resolved = path.resolve(targetPath)
  return resolved.startsWith(effectiveRoot) && !resolved.includes('..')
}

function getRequestRoot(req: Request): string {
  const queryRoot = req.query.root as string | undefined
  const headerRoot = req.headers['x-ide-workspace'] as string | undefined
  const requestedRoot = queryRoot || headerRoot
  if (!requestedRoot) return ROOT_PATH
  try {
    const resolved = path.resolve(requestedRoot)
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved
    }
  } catch { /* fall through */ }
  return ROOT_PATH
}

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  let entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW }
    requestCounts.set(ip, entry)
    return next()
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((entry.resetAt - now) / 1000) })
  }

  entry.count++
  return next()
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next()
  const key = req.headers['x-ide-key'] as string
  if (key !== SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid IDE key' })
  }
  next()
}

function fileLanguage(ext: string): string {
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
    '.css': 'css', '.scss': 'scss', '.html': 'html', '.json': 'json',
    '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.prisma': 'prisma',
    '.sql': 'sql', '.py': 'python', '.sh': 'bash', '.env': 'env',
    '.svg': 'xml', '.xml': 'xml', '.txt': 'text', '.graphql': 'graphql'
  }
  return map[ext] || 'text'
}

function fileIcon(ext: string): string {
  return FILE_ICONS[ext] || (ext.startsWith('.test') || ext.includes('.spec') ? '🧪' : '📄')
}

function humanSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function walkDir(dirPath: string, depth = 5): FileNode[] {
  if (depth <= 0) return []
  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const nodes: FileNode[] = []
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env' && entry.name !== '.gitignore') continue
      if (skipDirs.has(entry.name)) continue
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const children = walkDir(fullPath, depth - 1)
        nodes.push({
          name: entry.name, path: fullPath, type: 'directory',
          icon: '📁', size: 0, modified: '', children
        })
      } else {
        try {
          const stat = fs.statSync(fullPath)
          if (stat.size > MAX_FILE_SIZE) continue
          const ext = path.extname(entry.name)
          nodes.push({
            name: entry.name, path: fullPath, type: 'file',
            icon: fileIcon(ext), size: stat.size,
            modified: stat.mtime.toISOString(), language: fileLanguage(ext)
          })
        } catch { /* skip */ }
      }
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

function countFiles(nodes: FileNode[]): number {
  let count = 0
  for (const n of nodes) {
    if (n.type === 'file') count++
    if (n.children) count += countFiles(n.children)
  }
  return count
}

function totalSizeBytes(nodes: FileNode[]): number {
  let total = 0
  for (const n of nodes) {
    if (n.type === 'file') total += n.size
    if (n.children) total += totalSizeBytes(n.children)
  }
  return total
}

function searchFiles(dirPath: string, query: string, regex: boolean, caseSensitive: boolean, fileTypes: string[]): { file: string; line: number; column: number; content: string; context: string }[] {
  const results: { file: string; line: number; column: number; content: string; context: string }[] = []
  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])

  function searchInDir(p: string) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue
        const fullPath = path.join(p, entry.name)
        if (entry.isDirectory()) {
          searchInDir(fullPath)
        } else {
          if (fileTypes.length > 0) {
            const ext = path.extname(entry.name)
            if (!fileTypes.includes(ext)) continue
          }
          try {
            const stat = fs.statSync(fullPath)
            if (stat.size > MAX_FILE_SIZE) continue
            const content = fs.readFileSync(fullPath, 'utf-8')
            const lines = content.split('\n')
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              let match = false
              let column = 0
              if (regex) {
                try {
                  const re = new RegExp(query, caseSensitive ? 'g' : 'gi')
                  const m = re.exec(line)
                  if (m) { match = true; column = m.index + 1 }
                } catch { continue }
              } else {
                const searchLine = caseSensitive ? line : line.toLowerCase()
                const searchQuery = caseSensitive ? query : query.toLowerCase()
                const idx = searchLine.indexOf(searchQuery)
                if (idx !== -1) { match = true; column = idx + 1 }
              }
              if (match) {
                const start = Math.max(0, i - 1)
                const end = Math.min(lines.length, i + 2)
                results.push({
                  file: fullPath.replace(ROOT_PATH, '').replace(/\\/g, '/'),
                  line: i + 1, column,
                  content: line.trim(),
                  context: lines.slice(start, end).join('\n')
                })
                if (results.length >= 200) return
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
  }

  searchInDir(dirPath)
  return results
}

function initDatabase() {
  const dbDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      summary TEXT,
      context TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS file_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      content_preview TEXT,
      language TEXT,
      size INTEGER,
      indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      results_count INTEGER,
      searched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  log('info', 'Database initialized')
}

function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}

const app = express()

app.use(cors({ origin: (origin, cb) => {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) { cb(null, true); return }
  cb(new Error('Not allowed by CORS'))
} }))
app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)
app.use(authMiddleware)

app.use((req: Request, _res: Response, next: NextFunction) => {
  log('info', `${req.method} ${req.path}`, { ip: req.ip, query: req.query })
  next()
})

// ═══ FILESYSTEM ROUTES ═══

app.get('/files/list', (req: Request, res: Response) => {
  const root = getRequestRoot(req)
  const target = path.resolve(root, (req.query.path as string) || '.')
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  const tree = walkDir(target)
  const totalFiles = countFiles(tree)
  const totalSize = humanSize(totalSizeBytes(tree))
  res.json({ tree, totalFiles, totalSize })
})

app.get('/files/read', (req: Request, res: Response) => {
  const root = getRequestRoot(req)
  const target = path.resolve(root, (req.query.path as string) || '.')
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })
  const stat = fs.statSync(target)
  if (stat.isDirectory()) return res.status(400).json({ error: 'Path is a directory, not a file' })
  if (stat.size > MAX_FILE_SIZE) return res.status(413).json({ error: 'File too large', maxSize: humanSize(MAX_FILE_SIZE) })

  const content = fs.readFileSync(target, 'utf-8')
  const lines = content.split('\n').length
  const ext = path.extname(target)
  res.json({ content, language: fileLanguage(ext), encoding: 'utf-8', lines, size: humanSize(stat.size) })
})

app.post('/files/write', (req: Request, res: Response) => {
  const { path: filePath, content, createDirs } = req.body
  const root = getRequestRoot(req)
  const target = path.resolve(root, filePath || '')
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })

  if (createDirs) {
    const dir = path.dirname(target)
    fs.mkdirSync(dir, { recursive: true })
  }

  autoCheckpoint(req, filePath)

  fs.writeFileSync(target, content, 'utf-8')
  const bytesWritten = Buffer.byteLength(content, 'utf-8')
  log('info', 'File written', { path: target, bytes: bytesWritten })
  res.json({ success: true, path: target, bytesWritten })
})

app.post('/files/create', (req: Request, res: Response) => {
  const { path: filePath, type, content, template } = req.body
  if (!filePath) return res.status(400).json({ error: 'Path is required' })
  const root = getRequestRoot(req)
  const target = path.resolve(root, filePath)
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })

  const dir = path.dirname(target)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (type === 'dir') {
    fs.mkdirSync(target, { recursive: true })
    return res.json({ success: true, path: target, type: 'directory' })
  }

  let fileContent = content || ''
  if (!fileContent && template && FILE_TEMPLATES[template]) {
    fileContent = FILE_TEMPLATES[template]
  }

  fs.writeFileSync(target, fileContent, 'utf-8')
  log('info', 'File created', { path: target, template })
  res.json({ success: true, path: target, type: 'file' })
})

app.put('/files/edit', (req: Request, res: Response) => {
  const { path: filePath, edits } = req.body
  if (!filePath || !edits || !Array.isArray(edits)) return res.status(400).json({ error: 'path and edits[] are required' })
  const root = getRequestRoot(req)
  const target = path.resolve(root, filePath)
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })

  autoCheckpoint(req, filePath)

  let content = fs.readFileSync(target, 'utf-8')
  const originalContent = content
  let changesApplied = 0

  for (const edit of edits) {
    if (edit.oldContent && edit.newContent) {
      if (content.includes(edit.oldContent)) {
        const parts = content.split(edit.oldContent)
        if (parts.length === 2) {
          content = parts[0] + edit.newContent + parts[1]
          changesApplied++
        }
      }
    } else if (edit.line !== undefined && edit.newContent) {
      const lines = content.split('\n')
      if (edit.line > 0 && edit.line <= lines.length) {
        lines[edit.line - 1] = edit.newContent
        content = lines.join('\n')
        changesApplied++
      }
    }
  }

  fs.writeFileSync(target, content, 'utf-8')

  const diffLines: string[] = []
  const origLines = originalContent.split('\n')
  const newLines = content.split('\n')
  for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
    if (origLines[i] !== newLines[i]) {
      if (origLines[i] !== undefined) diffLines.push(`- ${origLines[i]}`)
      if (newLines[i] !== undefined) diffLines.push(`+ ${newLines[i]}`)
    }
  }

  res.json({ success: true, changesApplied, diff: diffLines.join('\n') })
})

app.delete('/files/delete', (req: Request, res: Response) => {
  const { path: filePath, recursive } = req.body
  if (!filePath) return res.status(400).json({ error: 'Path is required' })
  const root = getRequestRoot(req)
  const target = path.resolve(root, filePath)
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'Path not found' })

  if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true })

  const trashName = `${Date.now()}_${path.basename(target)}`
  const trashPath = path.join(TRASH_DIR, trashName)

  fs.renameSync(target, trashPath)
  log('info', 'Moved to trash', { from: target, to: trashPath })
  res.json({ success: true, movedTo: trashPath })
})

app.post('/files/move', (req: Request, res: Response) => {
  const { from, to } = req.body
  const root = getRequestRoot(req)
  const fromPath = path.resolve(root, from || '')
  const toPath = path.resolve(root, to || '')
  if (!isPathSafe(fromPath, root) || !isPathSafe(toPath, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(fromPath)) return res.status(404).json({ error: 'Source not found' })

  const toDir = path.dirname(toPath)
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true })

  fs.renameSync(fromPath, toPath)
  res.json({ success: true, from: fromPath, to: toPath })
})

app.post('/files/copy', (req: Request, res: Response) => {
  const { from, to } = req.body
  const root = getRequestRoot(req)
  const fromPath = path.resolve(root, from || '')
  const toPath = path.resolve(root, to || '')
  if (!isPathSafe(fromPath, root) || !isPathSafe(toPath, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(fromPath)) return res.status(404).json({ error: 'Source not found' })

  const toDir = path.dirname(toPath)
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true })

  fs.cpSync(fromPath, toPath, { recursive: true })
  res.json({ success: true, from: fromPath, to: toPath })
})

app.post('/files/rename', (req: Request, res: Response) => {
  const { path: filePath, newName } = req.body
  if (!filePath || !newName) return res.status(400).json({ error: 'path and newName are required' })
  const root = getRequestRoot(req)
  const target = path.resolve(root, filePath)
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'Path not found' })

  const newPath = path.join(path.dirname(target), sanitize(newName))
  fs.renameSync(target, newPath)
  res.json({ success: true, oldPath: target, newPath })
})

app.get('/files/search', (req: Request, res: Response) => {
  const searchPath = req.query.path as string || '.'
  const query = req.query.query as string || ''
  const regex = req.query.regex === 'true'
  const caseSensitive = req.query.caseSensitive === 'true'
  const fileTypes = (req.query.fileTypes as string || '').split(',').filter(Boolean)

  if (!query) return res.status(400).json({ error: 'query is required' })

  const root = getRequestRoot(req)
  const target = path.resolve(root, searchPath)
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })

  const results = searchFiles(target, query, regex, caseSensitive, fileTypes)

  if (db) {
    try {
      db.prepare('INSERT INTO search_history (query, results_count) VALUES (?, ?)').run(query, results.length)
    } catch { /* ignore */ }
  }

  res.json({ results, total: results.length })
})

app.get('/files/recent', (req: Request, res: Response) => {
  const root = getRequestRoot(req)
  const files: { path: string; modified: string; size: number }[] = []
  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])

  function scan(p: string) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue
        const fullPath = path.join(p, entry.name)
        if (entry.isDirectory()) {
          scan(fullPath)
        } else {
          try {
            const stat = fs.statSync(fullPath)
            if (stat.size <= MAX_FILE_SIZE) {
              files.push({ path: fullPath.replace(root, '').replace(/\\/g, '/'), modified: stat.mtime.toISOString(), size: stat.size })
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
  }

  scan(root)
  files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
  res.json({ files: files.slice(0, 20) })
})

app.get('/files/diff', (req: Request, res: Response) => {
  const root = getRequestRoot(req)
  const target = path.resolve(root, (req.query.path as string) || '.')
  if (!isPathSafe(target, root)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })

  exec(`git --no-pager diff HEAD -- "${target}"`, { cwd: root, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) return res.json({ diff: '', error: err.message })
    res.json({ diff: stdout })
  })
})

app.post('/files/restore', (req: Request, res: Response) => {
  const { path: filePath } = req.body
  if (!filePath) return res.status(400).json({ error: 'Path is required' })
  const root = getRequestRoot(req)
  const trashTarget = path.resolve(TRASH_DIR, path.basename(filePath))
  if (!fs.existsSync(trashTarget)) {
    const matches = fs.readdirSync(TRASH_DIR).filter(f => f.endsWith('_' + path.basename(filePath)))
    if (matches.length === 0) return res.status(404).json({ error: 'File not found in trash' })
    matches.sort().reverse()
    const restoreTarget = path.resolve(root, filePath)
    const restoreDir = path.dirname(restoreTarget)
    if (!fs.existsSync(restoreDir)) fs.mkdirSync(restoreDir, { recursive: true })
    fs.renameSync(path.join(TRASH_DIR, matches[0]), restoreTarget)
    return res.json({ success: true, restoredTo: restoreTarget })
  }
  const restoreTarget = path.resolve(root, filePath)
  const restoreDir = path.dirname(restoreTarget)
  if (!fs.existsSync(restoreDir)) fs.mkdirSync(restoreDir, { recursive: true })
  fs.renameSync(trashTarget, restoreTarget)
  res.json({ success: true, restoredTo: restoreTarget })
})

// ═══ CHECKPOINT ROUTES ═══

app.post('/checkpoint/create', (req: Request, res: Response) => {
  const { name, files } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const filePaths: string[] = files || []

  const meta = checkpoint.createCheckpoint(name, filePaths, ROOT_PATH)
  log('info', 'Checkpoint created', { id: meta.id, name, filesCount: meta.files.length })
  res.json({ checkpointId: meta.id, timestamp: meta.timestamp, files: meta.files })
})

app.get('/checkpoint/list', (_req: Request, res: Response) => {
  const checkpoints = checkpoint.listCheckpoints()
  res.json(checkpoints.map(c => ({
    id: c.id, name: c.name, timestamp: c.timestamp,
    files: c.files, size: checkpoint.humanSize(c.totalSize),
    operationId: c.operationId, aiPrompt: c.aiPrompt
  })))
})

app.post('/checkpoint/restore/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const { restored, failed } = checkpoint.restoreCheckpoint(id, ROOT_PATH)
  if (restored.length === 0 && failed.length > 0 && failed[0] === id) {
    return res.status(404).json({ error: 'Checkpoint not found' })
  }
  log('info', 'Checkpoint restored', { id, restored: restored.length, failed: failed.length })
  res.json({ restored, failed })
})

app.delete('/checkpoint/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const ok = checkpoint.deleteCheckpoint(id)
  if (!ok) return res.status(404).json({ error: 'Checkpoint not found' })
  log('info', 'Checkpoint deleted', { id })
  res.json({ success: true })
})

app.post('/checkpoint/diff/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = checkpoint.diffCheckpoint(id, ROOT_PATH)
  if (!result) return res.status(404).json({ error: 'Checkpoint not found' })
  res.json(result)
})

// ═══ TERMINAL ROUTES ═══

function isCommandAllowed(cmd: string): boolean {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) return false
  }
  const baseCmd = cmd.trim().split(/\s+/)[0]
  if (!baseCmd) return false
  return ALLOWED_COMMANDS.includes(baseCmd)
}

function isCurlSafe(cmd: string): boolean {
  if (!cmd.startsWith('curl')) return true
  const badTargets = ['https://', 'http://']
  for (const bt of badTargets) {
    const idx = cmd.indexOf(bt)
    if (idx !== -1) {
      const after = cmd.substring(idx)
      if (!after.startsWith('http://localhost') && !after.startsWith('http://127.0.0.1') && !after.startsWith('https://localhost')) {
        return false
      }
    }
  }
  return true
}

app.post('/terminal/run', (req: Request, res: Response) => {
  const { command, cwd, timeout } = req.body
  if (!command) return res.status(400).json({ error: 'command is required' })
  if (!isCommandAllowed(command)) return res.status(403).json({ error: 'Command not allowed', command })
  if (!isCurlSafe(command)) return res.status(403).json({ error: 'curl is restricted to localhost only' })

  const workDir = cwd ? path.resolve(ROOT_PATH, cwd) : ROOT_PATH
  if (!isPathSafe(workDir)) return res.status(403).json({ error: 'Working directory not allowed' })

  const start = Date.now()
  const maxTimeout = Math.min(timeout || 60_000, 300_000)

  exec(command, { cwd: workDir, maxBuffer: 10 * 1024 * 1024, timeout: maxTimeout }, (err, stdout, stderr) => {
    const duration = Date.now() - start
    res.json({ stdout, stderr, exitCode: err?.code || 0, duration })
  })
})

app.post('/terminal/stream', (req: Request, res: Response) => {
  const { command, cwd } = req.body
  if (!command) return res.status(400).json({ error: 'command is required' })
  if (!isCommandAllowed(command)) return res.status(403).json({ error: 'Command not allowed' })
  if (!isCurlSafe(command)) return res.status(403).json({ error: 'curl is restricted to localhost only' })

  const workDir = cwd ? path.resolve(ROOT_PATH, cwd) : ROOT_PATH
  if (!isPathSafe(workDir)) return res.status(403).json({ error: 'Working directory not allowed' })

  const processId = crypto.randomUUID()
  const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh'
  const shellArgs = process.platform === 'win32' ? ['-Command', command] : ['-c', command]

  const child = spawn(shell, shellArgs, { cwd: workDir, shell: false })

  activeProcesses.set(processId, {
    id: processId, command, pid: child.pid!,
    startTime: new Date().toISOString(), status: 'running', child
  })

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Process-Id': processId
  })

  child.stdout?.on('data', (data: Buffer) => {
    res.write(`event: stdout\ndata: ${JSON.stringify(data.toString())}\n\n`)
  })

  child.stderr?.on('data', (data: Buffer) => {
    res.write(`event: stderr\ndata: ${JSON.stringify(data.toString())}\n\n`)
  })

  child.on('close', (exitCode) => {
    const proc = activeProcesses.get(processId)
    if (proc) proc.status = exitCode === 0 ? 'done' : 'done'
    res.write(`event: done\ndata: ${JSON.stringify({ exitCode })}\n\n`)
    res.end()
  })

  child.on('error', (err) => {
    const proc = activeProcesses.get(processId)
    if (proc) proc.status = 'done'
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
    res.end()
  })

  req.on('close', () => {
    const proc = activeProcesses.get(processId)
    if (proc && proc.status === 'running') {
      proc.child.kill()
      proc.status = 'killed'
    }
  })
})

app.post('/terminal/kill', (req: Request, res: Response) => {
  const { processId } = req.body
  if (!processId) return res.status(400).json({ error: 'processId is required' })
  const proc = activeProcesses.get(processId)
  if (!proc) return res.status(404).json({ error: 'Process not found' })
  if (proc.status !== 'running') return res.status(400).json({ error: 'Process is not running', status: proc.status })

  proc.child.kill('SIGTERM')
  proc.status = 'killed'
  log('info', 'Process killed', { processId, pid: proc.pid })
  res.json({ success: true, processId, pid: proc.pid })
})

app.get('/terminal/processes', (_req: Request, res: Response) => {
  const procs = Array.from(activeProcesses.values()).map(p => ({
    id: p.id, command: p.command, pid: p.pid, startTime: p.startTime, status: p.status
  }))
  res.json({ processes: procs })
})

// ═══ GIT ROUTES ═══

function gitExec(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(`git ${args.join(' ')}`, { cwd: cwd || ROOT_PATH, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ stdout, stderr, exitCode: err?.code || 0 })
    })
  })
}

app.get('/git/status', async (_req: Request, res: Response) => {
  const { stdout } = await gitExec(['--no-pager', 'status', '--porcelain'])
  const branchOut = await gitExec(['branch', '--show-current'])
  const branch = branchOut.stdout.trim()

  const staged: string[] = []
  const unstaged: string[] = []
  const untracked: string[] = []

  for (const line of stdout.split('\n')) {
    if (!line) continue
    const status = line.substring(0, 2)
    const file = line.substring(3).trim()
    if (status[0] !== ' ' && status[0] !== '?') { staged.push(file); continue }
    if (status[1] !== ' ') { unstaged.push(file); continue }
    if (status === '??') untracked.push(file)
  }

  const behindOut = await gitExec(['rev-list', '--count', `${branch}..origin/${branch}`])
  const aheadOut = await gitExec(['rev-list', '--count', `origin/${branch}..${branch}`])
  const behind = parseInt(behindOut.stdout.trim()) || 0
  const ahead = parseInt(aheadOut.stdout.trim()) || 0

  res.json({ branch, staged, unstaged, untracked, ahead, behind })
})

app.get('/git/log', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const branch = req.query.branch as string || 'HEAD'
  const { stdout } = await gitExec([
    '--no-pager', 'log', `-${limit}`, '--format=%H|%h|%an|%ae|%aI|%s', branch
  ])
  const commits = stdout.split('\n').filter(Boolean).map(line => {
    const [hash, shortHash, author, email, date, ...msgParts] = line.split('|')
    return { hash, shortHash, message: msgParts.join('|'), author: `${author} <${email}>`, date, files: [] }
  })
  res.json({ commits })
})

app.get('/git/diff', async (req: Request, res: Response) => {
  const file = req.query.file as string
  const staged = req.query.staged === 'true'
  const args = ['--no-pager', 'diff']
  if (staged) args.push('--staged')
  if (file) args.push('--', file)

  const { stdout } = await gitExec(args)
  let additions = 0
  let deletions = 0
  for (const line of stdout.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    if (line.startsWith('-') && !line.startsWith('---')) deletions++
  }
  res.json({ diff: stdout, additions, deletions })
})

app.get('/git/branches', async (_req: Request, res: Response) => {
  const { stdout: local } = await gitExec(['branch', '--format=%(refname:short)'])
  const { stdout: remote } = await gitExec(['branch', '-r', '--format=%(refname:short)'])
  res.json({
    local: local.split('\n').filter(Boolean),
    remote: remote.split('\n').filter(Boolean)
  })
})

app.post('/git/stage', async (req: Request, res: Response) => {
  const { files } = req.body
  if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'files[] is required' })
  await gitExec(['add', ...files])
  res.json({ success: true })
})

app.post('/git/unstage', async (req: Request, res: Response) => {
  const { files } = req.body
  if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'files[] is required' })
  await gitExec(['reset', 'HEAD', ...files])
  res.json({ success: true })
})

app.post('/git/commit', async (req: Request, res: Response) => {
  const { message, description } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })
  const args = ['commit', '-m', message]
  if (description) args.push('-m', description)
  const { stdout, stderr, exitCode } = await gitExec(args)
  res.json({ success: exitCode === 0, stdout, stderr })
})

app.post('/git/push', async (req: Request, res: Response) => {
  const { branch, force } = req.body
  const args = ['push']
  if (force) args.push('--force')
  if (branch) args.push('origin', branch)
  const { stdout, stderr, exitCode } = await gitExec(args)
  res.json({ success: exitCode === 0, stdout, stderr })
})

app.post('/git/pull', async (req: Request, res: Response) => {
  const { branch } = req.body
  const args = ['pull']
  if (branch) args.push('origin', branch)
  const { stdout, stderr, exitCode } = await gitExec(args)
  res.json({ success: exitCode === 0, stdout, stderr })
})

app.post('/git/checkout', async (req: Request, res: Response) => {
  const { branch, create } = req.body
  if (!branch) return res.status(400).json({ error: 'branch is required' })
  const args = ['checkout']
  if (create) args.push('-b')
  args.push(branch)
  const { stdout, stderr, exitCode } = await gitExec(args)
  res.json({ success: exitCode === 0, stdout, stderr })
})

app.post('/git/stash', async (req: Request, res: Response) => {
  const { message } = req.body
  const args = ['stash', 'push']
  if (message) args.push('-m', message)
  const { stdout, stderr, exitCode } = await gitExec(args)
  res.json({ success: exitCode === 0, stdout, stderr })
})

app.post('/git/stash-pop', async (_req: Request, res: Response) => {
  const { stdout, stderr, exitCode } = await gitExec(['stash', 'pop'])
  res.json({ success: exitCode === 0, stdout, stderr })
})

// ═══ LSP / DIAGNOSTICS ROUTES ═══

app.get('/lsp/diagnostics', (req: Request, res: Response) => {
  const targetPath = req.query.path as string
  const errors: DiagError[] = []
  const cwd = targetPath ? path.resolve(ROOT_PATH, targetPath) : ROOT_PATH
  if (!isPathSafe(cwd)) return res.status(403).json({ error: 'Path not allowed' })

  exec('npx tsc --noEmit', { cwd: ROOT_PATH, maxBuffer: 10 * 1024 * 1024, timeout: 120_000 }, (err, _stdout, stderr) => {
    if (stderr) {
      const lines = stderr.split('\n')
      for (const line of lines) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)/)
        if (match) {
          errors.push({
            file: match[1].replace(ROOT_PATH, '').replace(/\\/g, '/'),
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[4] === 'error' ? 'error' : 'warning',
            message: match[5],
            source: 'tsc'
          })
        }
      }
    }

    exec('npx eslint . --format json', { cwd: ROOT_PATH, maxBuffer: 10 * 1024 * 1024, timeout: 60_000 }, (_err2, stdout2) => {
      try {
        const eslintResults = JSON.parse(stdout2 || '[]')
        for (const result of eslintResults) {
          for (const msg of result.messages || []) {
            errors.push({
              file: result.filePath?.replace(ROOT_PATH, '').replace(/\\/g, '/') || '',
              line: msg.line || 0,
              column: msg.column || 0,
              severity: msg.severity === 2 ? 'error' : 'warning',
              message: msg.message || '',
              source: 'eslint'
            })
          }
        }
      } catch { /* ignore */ }

      res.json({ errors, total: errors.length })
    })
  })
})

app.get('/lsp/symbols', (req: Request, res: Response) => {
  const targetPath = req.query.path as string
  if (!targetPath) return res.status(400).json({ error: 'path is required' })
  const target = path.resolve(ROOT_PATH, targetPath)
  if (!isPathSafe(target)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })

  const content = fs.readFileSync(target, 'utf-8')
  const symbols: SymbolInfo[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const exportMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
    if (exportMatch) { symbols.push({ name: exportMatch[1], kind: 'function', line: i + 1, column: (line.indexOf(exportMatch[1]) || 0) + 1 }); continue }

    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/)
    if (classMatch) { symbols.push({ name: classMatch[1], kind: 'class', line: i + 1, column: (line.indexOf(classMatch[1]) || 0) + 1 }); continue }

    const varMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)/)
    if (varMatch) { symbols.push({ name: varMatch[1], kind: 'variable', line: i + 1, column: (line.indexOf(varMatch[1]) || 0) + 1 }); continue }

    const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/)
    if (interfaceMatch) { symbols.push({ name: interfaceMatch[1], kind: 'interface', line: i + 1, column: (line.indexOf(interfaceMatch[1]) || 0) + 1 }); continue }

    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)/)
    if (typeMatch) { symbols.push({ name: typeMatch[1], kind: 'type', line: i + 1, column: (line.indexOf(typeMatch[1]) || 0) + 1 }); continue }

    const enumMatch = line.match(/(?:export\s+)?enum\s+(\w+)/)
    if (enumMatch) { symbols.push({ name: enumMatch[1], kind: 'enum', line: i + 1, column: (line.indexOf(enumMatch[1]) || 0) + 1 }) }
  }

  res.json({ symbols })
})

app.post('/lsp/definition', (req: Request, res: Response) => {
  const { path: filePath, line, column } = req.body
  if (!filePath || !line) return res.status(400).json({ error: 'path, line, and column are required' })
  const target = path.resolve(ROOT_PATH, filePath)
  if (!isPathSafe(target)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })

  const content = fs.readFileSync(target, 'utf-8')
  const lines = content.split('\n')
  const targetLine = lines[line - 1]
  if (!targetLine) return res.json({ found: false })

  const wordMatch = targetLine.substring(column - 1).match(/^\w+/)
  if (!wordMatch) return res.json({ found: false })
  const symbol = wordMatch[0]

  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])
  const results: { file: string; line: number; column: number }[] = []

  function scanForDefinition(p: string) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue
        const fullPath = path.join(p, entry.name)
        if (entry.isDirectory()) { scanForDefinition(fullPath); continue }
        const ext = path.extname(entry.name)
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) continue
        try {
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          const fileLines = fileContent.split('\n')
          for (let i = 0; i < fileLines.length; i++) {
            const l = fileLines[i]
            if (l.includes(`function ${symbol}`) || l.includes(`class ${symbol}`) ||
                l.includes(`const ${symbol}`) || l.includes(`interface ${symbol}`) ||
                l.includes(`type ${symbol}`) || l.includes(`enum ${symbol}`)) {
              results.push({
                file: fullPath.replace(ROOT_PATH, '').replace(/\\/g, '/'),
                line: i + 1,
                column: l.indexOf(symbol) + 1
              })
              if (results.length >= 10) return
            }
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  scanForDefinition(ROOT_PATH)
  res.json({ found: results.length > 0, symbol, definitions: results })
})

app.get('/lsp/references', (req: Request, res: Response) => {
  const targetPath = req.query.path as string
  const line = parseInt(req.query.line as string || '0')
  const column = parseInt(req.query.column as string || '0')

  if (!targetPath || !line) return res.status(400).json({ error: 'path, line, and column are required' })
  const target = path.resolve(ROOT_PATH, targetPath)
  if (!isPathSafe(target)) return res.status(403).json({ error: 'Path not allowed' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'File not found' })

  const content = fs.readFileSync(target, 'utf-8')
  const lines = content.split('\n')
  const targetLine = lines[line - 1]
  if (!targetLine) return res.json({ references: [] })

  const wordMatch = targetLine.substring(column - 1).match(/^\w+/)
  if (!wordMatch) return res.json({ references: [] })
  const symbol = wordMatch[0]

  const refs: { file: string; line: number; column: number }[] = []
  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])

  function scanForReferences(p: string) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue
        const fullPath = path.join(p, entry.name)
        if (entry.isDirectory()) { scanForReferences(fullPath); continue }
        const ext = path.extname(entry.name)
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) continue
        try {
          const fc = fs.readFileSync(fullPath, 'utf-8')
          const fl = fc.split('\n')
          for (let i = 0; i < fl.length; i++) {
            const idx = fl[i].indexOf(symbol)
            if (idx !== -1) {
              refs.push({
                file: fullPath.replace(ROOT_PATH, '').replace(/\\/g, '/'),
                line: i + 1, column: idx + 1
              })
              if (refs.length >= 100) return
            }
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  scanForReferences(ROOT_PATH)
  res.json({ symbol, references: refs, total: refs.length })
})

// ═══ SESSION ROUTES ═══

app.post('/sessions/create', (req: Request, res: Response) => {
  const { name, context } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare('INSERT INTO sessions (id, name, messages, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, '[]', context ? JSON.stringify(context) : null, now, now)

  res.json({ id, name, createdAt: now })
})

app.get('/sessions/list', (_req: Request, res: Response) => {
  const sessions = db.prepare('SELECT id, name, summary, created_at, updated_at FROM sessions ORDER BY updated_at DESC').all()
  res.json({ sessions })
})

app.get('/sessions/:id', (req: Request, res: Response) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any
  if (!session) return res.status(404).json({ error: 'Session not found' })
  res.json({
    ...session,
    messages: JSON.parse(session.messages || '[]'),
    context: session.context ? JSON.parse(session.context) : null
  })
})

app.put('/sessions/:id', (req: Request, res: Response) => {
  const { messages, summary } = req.body
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Session not found' })

  const updates: string[] = []
  const params: unknown[] = []

  if (messages) {
    updates.push('messages = ?')
    params.push(JSON.stringify(messages))
  }
  if (summary !== undefined) {
    updates.push('summary = ?')
    params.push(summary)
  }

  updates.push("updated_at = datetime('now')")
  params.push(req.params.id)

  db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true, id: req.params.id })
})

app.delete('/sessions/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' })
  res.json({ success: true })
})

app.get('/sessions/:id/export', (req: Request, res: Response) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as any
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const messages = JSON.parse(session.messages || '[]')
  let md = `# ${session.name}\n\n`
  md += `**ID:** ${session.id}\n**Criado:** ${session.created_at}\n**Atualizado:** ${session.updated_at}\n\n`
  if (session.summary) md += `## Resumo\n\n${session.summary}\n\n`
  md += '## Mensagens\n\n'
  for (const msg of messages) {
    md += `### ${msg.role === 'user' ? '👤 Usuário' : '🤖 AI'}\n\n${msg.content}\n\n---\n\n`
  }

  res.setHeader('Content-Type', 'text/markdown')
  res.setHeader('Content-Disposition', `attachment; filename="${sanitize(session.name)}.md"`)
  res.send(md)
})

// ═══ CONTEXT ROUTES ═══

app.get('/context/project', (_req: Request, res: Response) => {
  let packageJson: any = {}
  try { packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_PATH, 'package.json'), 'utf-8')) } catch { /* ignore */ }

  const deps = { ...packageJson.dependencies || {}, ...packageJson.devDependencies || {} }
  const framework = deps.next ? 'Next.js' : deps.react ? 'React' : 'Unknown'
  const language = 'TypeScript'
  const allFiles = walkDir(ROOT_PATH, 4)
  const fileCount = countFiles(allFiles)

  const topLevel = fs.readdirSync(ROOT_PATH).filter(e => !e.startsWith('.') && !['node_modules', 'dist'].includes(e))
  const structure = topLevel.join(', ')

  res.json({
    name: packageJson.name || 'unknown',
    framework, language, files: fileCount,
    dependencies: Object.keys(deps),
    structure,
    recentChanges: []
  })
})

app.post('/context/index', (_req: Request, res: Response) => {
  db.prepare('DELETE FROM file_index').run()

  const skipDirs = new Set(['node_modules', '.next', '.git', '.ide-trash', 'dist', '.turbo'])
  const insert = db.prepare('INSERT OR REPLACE INTO file_index (path, name, content_preview, language, size) VALUES (?, ?, ?, ?, ?)')

  let indexed = 0
  function indexDir(p: string) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue
        const fullPath = path.join(p, entry.name)
        if (entry.isDirectory()) { indexDir(fullPath); continue }
        const ext = path.extname(entry.name)
        if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.prisma', '.sql'].includes(ext)) continue
        try {
          const stat = fs.statSync(fullPath)
          if (stat.size > MAX_FILE_SIZE) continue
          const content = fs.readFileSync(fullPath, 'utf-8')
          const preview = content.substring(0, 500)
          insert.run(fullPath.replace(ROOT_PATH, '').replace(/\\/g, '/'), entry.name, preview, fileLanguage(ext), stat.size)
          indexed++
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  indexDir(ROOT_PATH)
  log('info', 'File index rebuilt', { indexedFiles: indexed })
  res.json({ success: true, indexedFiles: indexed })
})

app.get('/context/relevant', (req: Request, res: Response) => {
  const query = req.query.query as string || ''
  if (!query) return res.status(400).json({ error: 'query is required' })

  const terms = query.toLowerCase().split(/\s+/)
  const rows = db.prepare('SELECT path, name, content_preview, language FROM file_index').all() as any[]

  const scored = rows.map(row => {
    let score = 0
    const nameLower = (row.name || '').toLowerCase()
    const previewLower = (row.content_preview || '').toLowerCase()

    for (const term of terms) {
      if (nameLower.includes(term)) score += 5
      if (previewLower.includes(term)) score += 1
    }
    return { ...row, score }
  }).filter(r => r.score > 0)
   .sort((a, b) => b.score - a.score)
   .slice(0, 20)

  res.json({ files: scored })
})

// ═══ TASK QUEUE ROUTES ═══

app.post('/tasks/create', (req: Request, res: Response) => {
  const { name, command, cwd, priority } = req.body
  if (!name || !command) return res.status(400).json({ error: 'name and command are required' })

  try {
    const result = taskQueue.createTask(name, command, { cwd, priority })
    log('info', 'Task created', { taskId: result.taskId, name })
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/tasks/list', (_req: Request, res: Response) => {
  const result = taskQueue.getTaskList()
  res.json(result)
})

app.get('/tasks/:id/status', (req: Request, res: Response) => {
  const id = req.params.id as string
  const task = taskQueue.getTask(id)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

app.get('/tasks/:id/output', (req: Request, res: Response) => {
  const id = req.params.id as string
  const task = taskQueue.getTask(id)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  if (task.status === 'running') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Task-Id': id
    })

    const interval = setInterval(() => {
      const updated = taskQueue.getTask(id)
      if (!updated) { clearInterval(interval); res.end(); return }
      res.write(`data: ${JSON.stringify({ output: updated.output, progress: updated.progress, status: updated.status })}\n\n`)
      if (updated.status !== 'running') { clearInterval(interval); res.write(`event: done\ndata: ${JSON.stringify({ status: updated.status })}\n\n`); res.end() }
    }, 500)

    req.on('close', () => { clearInterval(interval) })
    return
  }

  res.json({ output: task.output, status: task.status, exitCode: task.exit_code })
})

app.post('/tasks/:id/cancel', (req: Request, res: Response) => {
  const id = req.params.id as string
  const ok = taskQueue.cancelTask(id)
  if (!ok) return res.status(404).json({ error: 'Task not found or cannot be cancelled' })
  log('info', 'Task cancelled', { taskId: id })
  res.json({ success: true })
})

app.get('/tasks/notifications', (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const onComplete = (data: any) => {
    res.write(`event: complete\ndata: ${JSON.stringify({ type: 'complete', ...data })}\n\n`)
  }
  const onFailure = (data: any) => {
    res.write(`event: failed\ndata: ${JSON.stringify({ type: 'failed', ...data })}\n\n`)
  }

  taskQueue.notificationBus.on('task:complete', onComplete)
  taskQueue.notificationBus.on('task:failure', onFailure)

  _req.on('close', () => {
    taskQueue.notificationBus.off('task:complete', onComplete)
    taskQueue.notificationBus.off('task:failure', onFailure)
  })
})

// ═══ CONFIG ROUTES ═══

app.get('/config', (_req: Request, res: Response) => {
  const { name, version } = JSON.parse(fs.readFileSync(path.join(ROOT_PATH, 'package.json'), 'utf-8'))
  res.json({ ...configData, projectName: name, projectVersion: version })
})

app.put('/config', (req: Request, res: Response) => {
  const allowedFields = ['rootPath', 'allowedCommands', 'maxFileSize', 'theme']
  for (const [key, value] of Object.entries(req.body)) {
    if (allowedFields.includes(key)) { (configData as any)[key] = value }
  }
  log('info', 'Config updated', configData)
  res.json({ success: true, config: configData })
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: configData.version || '1.0.0',
    rootPath: ROOT_PATH,
    uptime: process.uptime()
  })
})

// ═══ STARTUP ═══

if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true })
initDatabase()
taskQueue.initTaskQueue(db!, ROOT_PATH)

app.listen(PORT, () => {
  console.log(`[IDE Server] Running on http://localhost:${PORT}`)
  console.log(`[IDE Server] Root path: ${ROOT_PATH}`)
  log('info', `Server started on port ${PORT}`, { rootPath: ROOT_PATH })
})

export { app }
