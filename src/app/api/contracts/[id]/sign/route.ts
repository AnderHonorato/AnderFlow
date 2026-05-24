import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { auditLog } from '@/lib/audit'
import { checkCsrf } from '@/lib/middlewares/csrf'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkCsrf(request)) return NextResponse.json({ error: 'Requisição inválida' }, { status: 403 })

  try {
    const user = await getSessionUser(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const contract = await prisma.contract.findUnique({ where: { id }, include: { project: true } })
    if (!contract) return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 })

    if (contract.clientId !== user.id) {
      return NextResponse.json({ error: 'Apenas o cliente pode assinar' }, { status: 403 })
    }

    const body = await request.json()
    const { signature, signatureUrl } = body
    const signatureBase64 = signature

    const verificationHash = createHash('sha256')
      .update(contract.content + signatureBase64 + user.id + new Date().toISOString().split('T')[0])
      .digest('hex')

    await prisma.contract.update({
      where: { id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signature: signature || null,
        signatureUrl: signatureUrl || null,
        signerIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        verificationHash,
      },
    })

    if (contract.projectId && contract.project) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'CONTRACT',
            title: 'Contrato assinado',
            message: `O contrato do projeto "${contract.project?.name || 'Projeto'}" foi assinado pelo cliente.`,
            isRead: false,
          },
        })
      }
    }

    checkAndGrantAchievements(user.id, 'contract_signed', contract.projectId || undefined).catch((err) => { console.error('[achievements]', err?.message || err) })

    auditLog({
      userId: user.id,
      userName: user.name,
      action: 'SIGN',
      entity: 'Contract',
      entityId: contract.id,
      description: `Contrato assinado: ${contract.project?.name || contract.id}`,
    }).catch((err) => { console.error('[audit]', err?.message || err) })

    return NextResponse.json({ message: 'Contrato assinado com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao assinar' }, { status: 500 })
  }
}
