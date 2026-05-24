import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const clientSchema = z.object({
  name: z.string().min(2, 'Nome obrigatorio'),
  email: z.string().email('Email invalido'),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 40) return unauthorizedResponse()

  const body = await request.json()
  const { clients } = body

  if (!Array.isArray(clients) || clients.length === 0) {
    return NextResponse.json({ error: 'Array de clientes obrigatorio' }, { status: 400 })
  }

  const created: string[] = []
  const skipped: { email: string; reason: string }[] = []
  const errors: { index: number; email?: string; error: string }[] = []

  const existingEmails = new Set<string>()
  const batchSize = 100

  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize)
    const emailsInBatch = batch.map(c => c.email?.toLowerCase().trim()).filter(Boolean)

    const existing = await prisma.user.findMany({
      where: { email: { in: emailsInBatch } },
      select: { email: true },
    })
    existing.forEach(e => existingEmails.add(e.email.toLowerCase()))
  }

  for (let index = 0; index < clients.length; index++) {
    const raw = clients[index]
    try {
      const parsed = clientSchema.parse({
        name: raw.name?.trim(),
        email: raw.email?.trim().toLowerCase(),
        company: raw.company?.trim() || null,
        phone: raw.phone?.trim() || null,
        city: raw.city?.trim() || null,
      })

      if (existingEmails.has(parsed.email)) {
        skipped.push({ email: parsed.email, reason: 'Email ja cadastrado' })
        continue
      }

      const hashedPassword = await bcrypt.hash('cliente123', 10)

      const newClient = await prisma.user.create({
        data: {
          name: parsed.name,
          email: parsed.email,
          password: hashedPassword,
          company: parsed.company,
          phone: parsed.phone,
          role: 'CLIENT',
          isAccountActive: true,
        },
      })

      await prisma.channel.create({
        data: {
          name: parsed.name || 'Geral',
          clientId: newClient.id,
        },
      }).catch(() => {})

      existingEmails.add(parsed.email)
      created.push(parsed.email)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        errors.push({
          index,
          email: raw.email,
          error: err.errors.map(e => e.message).join(', '),
        })
      } else {
        errors.push({ index, email: raw.email, error: 'Erro ao criar cliente' })
      }
    }
  }

  return NextResponse.json({
    data: {
      created: created.length,
      skipped: skipped.length,
      errors: errors.length > 0 ? errors.slice(0, 20) : [],
    },
  })
}
