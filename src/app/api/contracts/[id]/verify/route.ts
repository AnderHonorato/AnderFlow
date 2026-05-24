import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    })

    if (!contract) {
      return NextResponse.json({ valid: false, error: 'Contrato nao encontrado' })
    }

    if (!contract.verificationHash) {
      return NextResponse.json({ valid: false, error: 'Contrato nao possui hash de verificacao' })
    }

    if (!contract.signature || !contract.signedAt) {
      return NextResponse.json({ valid: false, error: 'Contrato nao assinado' })
    }

    const hash = createHash('sha256')
      .update(contract.content + contract.signature + contract.clientId + new Date(contract.signedAt).toISOString().split('T')[0])
      .digest('hex')

    const valid = hash === contract.verificationHash

    return NextResponse.json({
      valid,
      signedAt: contract.signedAt,
      signerName: contract.client?.name,
      projectName: contract.project?.name,
    })
  } catch (error) {
    console.error('[verify-contract] Error:', error)
    return NextResponse.json({ valid: false, error: 'Erro ao verificar' })
  }
}
