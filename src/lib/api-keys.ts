import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || 'anderflow-fallback-key-change-me'
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptKey(plain: string): { hash: string; mask: string } {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const hash = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
  const mask = plain.length > 8 ? `${plain.slice(0, 4)}****${plain.slice(-4)}` : '****'
  return { hash, mask }
}

export function decryptKey(hash: string): string {
  const key = getKey()
  const parts = hash.split(':')
  if (parts.length !== 3) throw new Error('Formato de hash invalido')
  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encrypted = Buffer.from(parts[2], 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export async function getActiveKey(provider: string): Promise<{ key: string; id: string } | null> {
  const keyRow = await prisma.apiKey.findFirst({
    where: { provider, isActive: true },
    orderBy: { priority: 'asc' },
  })
  if (!keyRow) return null
  try {
    return { key: decryptKey(keyRow.keyHash), id: keyRow.id }
  } catch {
    return null
  }
}

export async function rotateKey(provider: string, failedKeyId: string): Promise<string | null> {
  await prisma.apiKey.update({
    where: { id: failedKeyId },
    data: { isActive: false },
  })

  const nextKey = await prisma.apiKey.findFirst({
    where: { provider, isActive: true, id: { not: failedKeyId } },
    orderBy: { priority: 'asc' },
  })

  if (!nextKey) {
    await prisma.apiKey.update({
      where: { id: failedKeyId },
      data: { isActive: true },
    })
    return null
  }

  try {
    return decryptKey(nextKey.keyHash)
  } catch {
    return null
  }
}

export async function getProviders(): Promise<string[]> {
  const result = await prisma.apiKey.findMany({
    where: { isActive: true },
    select: { provider: true },
    distinct: ['provider'],
  })
  return result.map(r => r.provider)
}
