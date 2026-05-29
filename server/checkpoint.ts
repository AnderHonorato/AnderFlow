import * as fs from 'node:fs'
import * as path from 'node:path'
import * as zlib from 'node:zlib'
import * as crypto from 'node:crypto'

const CHECKPOINTS_DIR = path.resolve(process.env.IDE_ROOT_PATH || process.cwd(), 'server', 'checkpoints')
const MAX_CHECKPOINTS = 50

export interface CheckpointMeta {
  id: string
  name: string
  timestamp: string
  operationId?: string
  aiPrompt?: string
  files: string[]
  fileSizes: Record<string, number>
  totalSize: number
}

interface CheckpointData {
  meta: CheckpointMeta
  snapshots: Record<string, string>
}

function ensureDir() {
  if (!fs.existsSync(CHECKPOINTS_DIR)) {
    fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true })
  }
}

function checkpointPath(id: string): string {
  return path.join(CHECKPOINTS_DIR, `${id}.cp.gz`)
}

function metaPath(id: string): string {
  return path.join(CHECKPOINTS_DIR, `${id}.meta.json`)
}

function cleanupOldest() {
  ensureDir()
  const metas = fs.readdirSync(CHECKPOINTS_DIR)
    .filter(f => f.endsWith('.meta.json'))
    .map(f => f.replace('.meta.json', ''))

  if (metas.length <= MAX_CHECKPOINTS) return

  const sorted = metas
    .map(id => {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath(id), 'utf-8')) as CheckpointMeta
        return { id, timestamp: meta.timestamp }
      } catch { return null }
    })
    .filter(Boolean) as { id: string; timestamp: string }[]

  sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const toDelete = sorted.slice(0, sorted.length - MAX_CHECKPOINTS)
  for (const { id } of toDelete) {
    deleteCheckpointFiles(id)
  }
}

function deleteCheckpointFiles(id: string) {
  const cp = checkpointPath(id)
  const mp = metaPath(id)
  try { if (fs.existsSync(cp)) fs.unlinkSync(cp) } catch { /* ignore */ }
  try { if (fs.existsSync(mp)) fs.unlinkSync(mp) } catch { /* ignore */ }
}

function readSnapshot(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    if (stat.size > 10 * 1024 * 1024) return null
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function snapshotFiles(filePaths: string[], rootPath: string): Record<string, string> {
  const snapshots: Record<string, string> = {}
  for (const fp of filePaths) {
    const resolved = path.resolve(rootPath, fp)
    if (!resolved.startsWith(rootPath)) continue
    const content = readSnapshot(resolved)
    const relPath = resolved.replace(rootPath, '').replace(/\\/g, '/') || '/'
    if (content !== null) {
      snapshots[relPath] = content
    }
  }
  return snapshots
}

export function createCheckpoint(
  name: string,
  filePaths: string[],
  rootPath: string,
  options?: { operationId?: string; aiPrompt?: string }
): CheckpointMeta {
  ensureDir()
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const snapshots = snapshotFiles(filePaths, rootPath)

  const fileSizes: Record<string, number> = {}
  let totalSize = 0
  const normalizedPaths = Object.keys(snapshots)
  for (const fp of normalizedPaths) {
    const size = Buffer.byteLength(snapshots[fp], 'utf-8')
    fileSizes[fp] = size
    totalSize += size
  }

  const meta: CheckpointMeta = {
    id, name, timestamp, files: normalizedPaths, fileSizes, totalSize,
    operationId: options?.operationId,
    aiPrompt: options?.aiPrompt
  }

  const data: CheckpointData = { meta, snapshots }
  const compressed = zlib.gzipSync(JSON.stringify(data))
  fs.writeFileSync(checkpointPath(id), compressed)
  fs.writeFileSync(metaPath(id), JSON.stringify(meta, null, 2), 'utf-8')

  cleanupOldest()
  return meta
}

export function getOrCreateGroupCheckpoint(
  operationId: string,
  name: string,
  rootPath: string,
  options?: { aiPrompt?: string; filePaths?: string[] }
): CheckpointMeta | null {
  ensureDir()
  const existing = findCheckpointByOperationId(operationId)
  if (existing) {
    if (options?.filePaths && options.filePaths.length > 0) {
      addFilesToCheckpoint(existing.id, options.filePaths, rootPath)
    }
    return existing
  }
  return createCheckpoint(name, options?.filePaths || [], rootPath, { operationId, aiPrompt: options?.aiPrompt })
}

function findCheckpointByOperationId(operationId: string): CheckpointMeta | null {
  ensureDir()
  const metas = fs.readdirSync(CHECKPOINTS_DIR).filter(f => f.endsWith('.meta.json'))
  for (const mf of metas) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(CHECKPOINTS_DIR, mf), 'utf-8')) as CheckpointMeta
      if (meta.operationId === operationId) return meta
    } catch { /* skip */ }
  }
  return null
}

function loadCheckpointData(id: string): CheckpointData | null {
  const cp = checkpointPath(id)
  if (!fs.existsSync(cp)) return null
  try {
    const compressed = fs.readFileSync(cp)
    const json = zlib.gunzipSync(compressed).toString('utf-8')
    return JSON.parse(json) as CheckpointData
  } catch { return null }
}

export function addFilesToCheckpoint(id: string, filePaths: string[], rootPath: string): boolean {
  const data = loadCheckpointData(id)
  if (!data) return false

  const newSnapshots = snapshotFiles(filePaths, rootPath)
  let changed = false

  for (const [fp, content] of Object.entries(newSnapshots)) {
    if (!data.snapshots[fp]) {
      data.snapshots[fp] = content
      data.meta.files.push(fp)
      data.meta.fileSizes[fp] = Buffer.byteLength(content, 'utf-8')
      data.meta.totalSize += data.meta.fileSizes[fp]
      changed = true
    }
  }

  if (changed) {
    data.meta.timestamp = new Date().toISOString()
    const compressed = zlib.gzipSync(JSON.stringify(data))
    fs.writeFileSync(checkpointPath(id), compressed)
    fs.writeFileSync(metaPath(id), JSON.stringify(data.meta, null, 2), 'utf-8')
  }

  return true
}

export function listCheckpoints(): CheckpointMeta[] {
  ensureDir()
  const results: CheckpointMeta[] = []
  const metas = fs.readdirSync(CHECKPOINTS_DIR).filter(f => f.endsWith('.meta.json'))
  for (const mf of metas) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(CHECKPOINTS_DIR, mf), 'utf-8')) as CheckpointMeta
      results.push(meta)
    } catch { /* skip */ }
  }
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return results
}

export function getCheckpoint(id: string): CheckpointMeta | null {
  try {
    const m = JSON.parse(fs.readFileSync(metaPath(id), 'utf-8')) as CheckpointMeta
    return m
  } catch { return null }
}

export function restoreCheckpoint(id: string, rootPath: string): { restored: string[]; failed: string[] } {
  const data = loadCheckpointData(id)
  if (!data) return { restored: [], failed: [id] }

  const restored: string[] = []
  const failed: string[] = []

  for (const [relPath, content] of Object.entries(data.snapshots)) {
    const absPath = path.join(rootPath, relPath.replace(/^\//, ''))
    try {
      const dir = path.dirname(absPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(absPath, content, 'utf-8')
      restored.push(relPath)
    } catch {
      failed.push(relPath)
    }
  }

  return { restored, failed }
}

export function deleteCheckpoint(id: string): boolean {
  if (!fs.existsSync(checkpointPath(id)) && !fs.existsSync(metaPath(id))) return false
  deleteCheckpointFiles(id)
  return true
}

export function diffCheckpoint(id: string, rootPath: string): { diffs: { file: string; before: string; after: string | null; additions: number; deletions: number }[] } | null {
  const data = loadCheckpointData(id)
  if (!data) return null

  const diffs: { file: string; before: string; after: string | null; additions: number; deletions: number }[] = []

  for (const [relPath, snapshotContent] of Object.entries(data.snapshots)) {
    const absPath = path.join(rootPath, relPath.replace(/^\//, ''))
    const currentContent = readSnapshot(absPath)
    const before = snapshotContent
    const after = currentContent

    let additions = 0
    let deletions = 0
    if (currentContent !== null) {
      const beforeLines = before.split('\n')
      const afterLines = currentContent.split('\n')
      for (const l of afterLines) {
        if (!beforeLines.includes(l)) additions++
      }
      for (const l of beforeLines) {
        if (!afterLines.includes(l)) deletions++
      }
    }

    diffs.push({ file: relPath, before, after, additions, deletions })
  }

  return { diffs }
}

export function humanSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}
