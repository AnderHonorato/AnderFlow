import { EventEmitter } from 'node:events'
import * as path from 'node:path'
import { exec, ChildProcess } from 'node:child_process'
import * as crypto from 'node:crypto'
import type Database from 'better-sqlite3'

const MAX_CONCURRENT = 3
const CLEANUP_AGE_MS = 60 * 60 * 1000

const ALLOWED_COMMANDS = [
  'npm', 'npx', 'node', 'git', 'ls', 'cat', 'echo', 'mkdir', 'cp', 'mv',
  'tsc', 'prisma', 'tsx', 'curl', 'dir', 'type', 'find', 'findstr'
]

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//, /format/, /shutdown/, /reboot/, /sudo/, /chmod\s+777/,
  /del\s+\/f\s+\/s/, /rd\s+\/s/, /Format-Volume/, /Stop-Computer/
]

export interface Task {
  id: string
  name: string
  command: string
  cwd: string | null
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  start_time: string | null
  end_time: string | null
  duration: number | null
  output: string
  exit_code: number | null
  created_at: string
}

interface TaskRunContext {
  task: Task
  db: Database.Database
  rootPath: string
  process: ChildProcess | null
}

export const notificationBus = new EventEmitter()
notificationBus.setMaxListeners(100)

let db: Database.Database | null = null
let rootPath = ''
let pendingQueue: Task[] = []
let runningTasks = new Map<string, TaskRunContext>()
let tickTimer: ReturnType<typeof setInterval> | null = null

export function initTaskQueue(database: Database.Database, rp: string) {
  db = database
  rootPath = rp

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      cwd TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      start_time TEXT,
      end_time TEXT,
      duration INTEGER,
      output TEXT NOT NULL DEFAULT '',
      exit_code INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  loadPendingFromDb()
  startTick()
}

function loadPendingFromDb() {
  if (!db) return
  const rows = db.prepare("SELECT * FROM tasks WHERE status = 'pending' ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, created_at ASC").all() as Task[]
  pendingQueue = rows
}

function startTick() {
  if (tickTimer) return
  tickTimer = setInterval(tick, 250)
}

export function stopTick() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
}

function tick() {
  processNext()
  cleanupOldTasks()
}

function processNext() {
  if (!db) return
  if (runningTasks.size >= MAX_CONCURRENT) return
  if (pendingQueue.length === 0) return

  pendingQueue.sort((a, b) => {
    const p = { high: 0, normal: 1, low: 2 }
    return (p[a.priority] || 1) - (p[b.priority] || 1)
  })

  const task = pendingQueue.shift()!
  if (!task) return

  runningTasks.set(task.id, { task, db, rootPath, process: null })
  executeTask(task)
}

function isCommandAllowed(cmd: string): boolean {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) return false
  }
  const baseCmd = cmd.trim().split(/\s+/)[0].toLowerCase()
  return ALLOWED_COMMANDS.includes(baseCmd)
}

function executeTask(task: Task) {
  if (!db) return

  const startTime = new Date().toISOString()

  if (!isCommandAllowed(task.command)) {
    updateTask(task.id, {
      status: 'failed',
      start_time: startTime,
      end_time: startTime,
      duration: 0,
      output: `Command not allowed: ${task.command}`,
      exit_code: 1
    })
    notificationBus.emit('task:failure', { taskId: task.id, name: task.name, duration: 0 })
    runningTasks.delete(task.id)
    return
  }

  updateTask(task.id, { status: 'running', start_time: startTime, progress: 10 })

  const cwd = task.cwd ? path.resolve(rootPath, task.cwd) : rootPath
  const child = exec(task.command, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 300_000 })

  const ctx = runningTasks.get(task.id)
  if (ctx) ctx.process = child

  let stdout = ''
  let stderr = ''

  child.stdout?.on('data', (data) => {
    stdout += data.toString()
    updateTask(task.id, { output: stdout + stderr, progress: Math.min(50 + Math.floor(stdout.length / 1024), 90) })
  })

  child.stderr?.on('data', (data) => {
    stderr += data.toString()
    updateTask(task.id, { output: stdout + stderr })
  })

  child.on('close', (exitCode) => {
    const endTime = new Date().toISOString()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = end - start
    const status = exitCode === 0 ? 'completed' : 'failed'
    const output = stdout + stderr

    updateTask(task.id, {
      status,
      end_time: endTime,
      duration,
      output,
      exit_code: exitCode ?? 1,
      progress: 100
    })

    runningTasks.delete(task.id)

    if (status === 'completed') {
      notificationBus.emit('task:complete', { taskId: task.id, name: task.name, duration })
    } else {
      notificationBus.emit('task:failure', { taskId: task.id, name: task.name, duration })
    }
  })

  child.on('error', (err) => {
    const endTime = new Date().toISOString()
    updateTask(task.id, {
      status: 'failed',
      end_time: endTime,
      duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      output: stdout + stderr + '\n[ERROR] ' + err.message,
      exit_code: 1,
      progress: 100
    })
    notificationBus.emit('task:failure', { taskId: task.id, name: task.name, duration: 0 })
    runningTasks.delete(task.id)
  })
}

function updateTask(id: string, fields: Partial<Task>) {
  if (!db) return
  const setClauses: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      setClauses.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (setClauses.length > 0) {
    values.push(id)
    db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)
  }
}

function cleanupOldTasks() {
  if (!db) return
  const cutoff = new Date(Date.now() - CLEANUP_AGE_MS).toISOString()
  db.prepare("DELETE FROM tasks WHERE status IN ('completed', 'failed', 'cancelled') AND end_time < ?").run(cutoff)
}

export function createTask(
  name: string,
  command: string,
  options?: { cwd?: string; priority?: 'low' | 'normal' | 'high' }
): { taskId: string; queuePosition: number } {
  if (!db) throw new Error('Task queue not initialized')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const priority = options?.priority || 'normal'
  const cwd = options?.cwd || null

  db.prepare(`INSERT INTO tasks (id, name, command, cwd, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`).run(id, name, command, cwd, priority, now)

  const task: Task = {
    id, name, command, cwd, priority, status: 'pending',
    progress: 0, start_time: null, end_time: null, duration: null,
    output: '', exit_code: null, created_at: now
  }

  pendingQueue.push(task)
  return { taskId: id, queuePosition: pendingQueue.length }
}

export function getTaskList(): { tasks: Task[] } {
  if (!db) return { tasks: [] }
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[]
  return { tasks }
}

export function getTask(id: string): Task | null {
  if (!db) return null
  return (db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task) || null
}

export function getTaskOutput(id: string): Task | null {
  return getTask(id)
}

export function cancelTask(id: string): boolean {
  if (!db) return false

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined
  if (!task) return false

  if (task.status === 'pending') {
    pendingQueue = pendingQueue.filter(t => t.id !== id)
    updateTask(id, {
      status: 'cancelled',
      end_time: new Date().toISOString(),
      duration: 0,
      progress: 100
    })
    return true
  }

  if (task.status === 'running') {
    const ctx = runningTasks.get(id)
    if (ctx?.process) {
      ctx.process.kill('SIGTERM')
    }
    updateTask(id, {
      status: 'cancelled',
      end_time: new Date().toISOString(),
      progress: 100
    })
    runningTasks.delete(id)
    return true
  }

  return false
}
