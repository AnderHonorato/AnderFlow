import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner } from '@/lib/auth-utils'
import { encryptKey, decryptKey } from '@/lib/api-keys'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const keys = await prisma.apiKey.findMany({
      select: {
        id: true,
        provider: true,
        label: true,
        keyMask: true,
        isActive: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ provider: 'asc' }, { priority: 'asc' }],
    })

    return NextResponse.json({ data: keys })
  } catch (error: any) {
    console.error('[api-keys] GET error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao buscar chaves.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()

    if (body.revealId) {
      const keyRow = await prisma.apiKey.findUnique({ where: { id: body.revealId } })
      if (!keyRow) return NextResponse.json({ error: 'Chave nao encontrada.' }, { status: 404 })
      try {
        return NextResponse.json({ key: decryptKey(keyRow.keyHash) })
      } catch {
        return NextResponse.json({ error: 'Erro ao descriptografar chave.' }, { status: 500 })
      }
    }

    const { provider, key, label } = body

    if (!provider || !key) {
      return NextResponse.json({ error: 'provider e key obrigatorios.' }, { status: 400 })
    }

    const { hash, mask } = encryptKey(key)

    const created = await prisma.apiKey.create({
      data: {
        provider,
        label: label || null,
        keyHash: hash,
        keyMask: mask,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        keyMask: true,
        isActive: true,
        priority: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: created })
  } catch (error: any) {
    console.error('[api-keys] POST error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao salvar chave.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 })
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: isActive ?? true },
    })

    return NextResponse.json({ message: 'Chave atualizada.' })
  } catch (error: any) {
    console.error('[api-keys] PATCH error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao atualizar chave.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user?.id || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 })
    }

    await prisma.apiKey.delete({ where: { id } })

    return NextResponse.json({ message: 'Chave removida.' })
  } catch (error: any) {
    console.error('[api-keys] DELETE error:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao remover chave.' }, { status: 500 })
  }
}
