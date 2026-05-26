import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import { cargoParaNivel } from '@/lib/hierarquia'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || cargoParaNivel(token.role as string) < 40) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params

    const action = await (prisma as any).botActionLog.findUnique({
      where: { id },
    })

    if (!action) {
      return NextResponse.json({ error: 'Acao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: action.id,
        botId: action.botId,
        botName: action.botName,
        botRole: action.botRole,
        action: action.action,
        endpoint: action.endpoint,
        method: action.method,
        requestBody: action.requestBody,
        status: action.status,
        result: action.result,
        error: action.error,
        prompt: action.prompt,
        aiResponse: action.aiResponse,
        tokensUsed: action.tokensUsed,
        costEstimate: action.costEstimate,
        createdAt: action.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
