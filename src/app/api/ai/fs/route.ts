import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'
import { exec } from 'child_process'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const PROJECT_ROOT = resolve(process.cwd())
const MAX_FILE_SIZE = 500 * 1024 // 500KB

function safePath(requested: string): string {
  const resolved = resolve(join(PROJECT_ROOT, requested))
  if (!resolved.startsWith(PROJECT_ROOT)) throw new Error('Acesso negado: fora do projeto')
  return resolved
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isAdmin(user)) {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
    }

    const { action, path, content, command } = await request.json() as {
      action: string
      path?: string
      content?: string
      command?: string
    }

    switch (action) {
      case 'list': {
        const dir = path ? safePath(path) : PROJECT_ROOT
        if (!existsSync(dir)) return NextResponse.json({ error: `Diretorio nao encontrado: ${path}` }, { status: 404 })
        const entries = readdirSync(dir, { withFileTypes: true })
        const items = entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file',
          size: e.isFile() ? statSync(join(dir, e.name)).size : 0,
        })).sort((a, b) => (a.type === 'dir' && b.type === 'file') ? -1 : (a.type === 'file' && b.type === 'dir') ? 1 : a.name.localeCompare(b.name))
        return NextResponse.json({ action: 'list', path: path || '.', items })
      }

      case 'read': {
        if (!path) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })
        const filePath = safePath(path)
        if (!existsSync(filePath)) return NextResponse.json({ error: `Arquivo nao encontrado: ${path}` }, { status: 404 })
        const stats = statSync(filePath)
        if (stats.isDirectory()) return NextResponse.json({ error: `${path} e um diretorio` }, { status: 400 })
        if (stats.size > MAX_FILE_SIZE) {
          return NextResponse.json({
            action: 'read',
            path,
            content: `[Arquivo muito grande: ${(stats.size / 1024).toFixed(1)}KB. Use offset/limit.]`,
            size: stats.size,
            truncated: true,
          })
        }
        const data = readFileSync(filePath, 'utf-8')
        return NextResponse.json({ action: 'read', path, content: data, size: stats.size })
      }

      case 'write': {
        if (!path) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })
        if (content === undefined) return NextResponse.json({ error: 'content obrigatorio' }, { status: 400 })
        const filePath = safePath(path)
        writeFileSync(filePath, content, 'utf-8')
        return NextResponse.json({ action: 'write', path, ok: true, bytes: Buffer.byteLength(content, 'utf-8') })
      }

      case 'exec': {
        if (!command) return NextResponse.json({ error: 'command obrigatorio' }, { status: 400 })
        const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
          exec(command, { cwd: PROJECT_ROOT, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            resolve({ stdout: stdout || '', stderr: stderr || '', code: error?.code || 0 })
          })
        })
        return NextResponse.json({ action: 'exec', command, ...result })
      }

      default:
        return NextResponse.json({ error: `Acao desconhecida: ${action}. Use list/read/write/exec` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[ai/fs]', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
