import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import * as jose from 'jose'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const validateToken = searchParams.get('token')
  const projectId = searchParams.get('projectId')
  const stepId = searchParams.get('stepId')

  // Validate token mode
  if (validateToken) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')
      const { payload } = await jose.jwtVerify(validateToken, secret)
      const project = await prisma.project.findUnique({
        where: { id: payload.projectId as string },
        select: { name: true },
      })
      return NextResponse.json({
        data: {
          valid: true,
          projectId: payload.projectId,
          stepId: payload.stepId,
          projectName: project?.name || 'Projeto',
        },
      })
    } catch {
      return NextResponse.json({ data: { valid: false } })
    }
  }

  // Generate token mode (admin only)
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  if (!projectId || !stepId) {
    return NextResponse.json({ error: 'projectId e stepId são obrigatórios' }, { status: 400 })
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')
  const exp = Math.floor(Date.now() / 1000) + 48 * 60 * 60

  const jwt = await new jose.SignJWT({ projectId, stepId, type: 'approval' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .sign(secret)

  return NextResponse.json({ data: { link: `/approve/${jwt}`, token: jwt } })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, approved, comment } = body

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'anderflow-secret')

    let payload: { projectId: string; stepId: string; type: string }
    try {
      const { payload: verified } = await jose.jwtVerify(token, secret)
      payload = verified as { projectId: string; stepId: string; type: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    if (payload.type !== 'approval') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    await prisma.taskFeedback.create({
      data: {
        projectId: payload.projectId,
        stepId: parseInt(payload.stepId),
        clientId: 'public-approval',
        approved: approved ?? true,
        comment: comment || null,
      },
    })

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PROJECT_UPDATE',
          title: approved ? 'Entrega aprovada via link' : 'Ajuste solicitado via link',
          message: `Step ${payload.stepId} do projeto foi ${approved ? 'aprovado' : 'reprovado'} pelo cliente.${comment ? ' Comentário: ' + comment : ''}`,
          metadata: JSON.stringify({ projectId: payload.projectId, stepId: payload.stepId }),
        },
      })
    }

    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error('[quick-approve:POST]', error)
    return NextResponse.json({ error: 'Erro ao registrar aprovação' }, { status: 500 })
  }
}
