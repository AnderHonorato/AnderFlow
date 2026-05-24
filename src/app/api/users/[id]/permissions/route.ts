import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, canManageRole, getRoleLevel, ROLES, unauthorizedResponse } from '@/lib/auth-utils'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const editor = await getSessionUser()
  if (!editor || !isAdmin(editor)) return unauthorizedResponse()

  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const { role, permissions } = await req.json()

  if (role && !ROLES.includes(role)) {
    return NextResponse.json({ error: 'Role inválida' }, { status: 400 })
  }

  if (role && !canManageRole(editor.role, targetUser.role)) {
    return NextResponse.json({ error: 'Você não pode modificar este usuário' }, { status: 403 })
  }

  if (role && role !== targetUser.role) {
    const editorLevel = getRoleLevel(editor.role)
    const targetNewLevel = getRoleLevel(role)
    if (targetNewLevel >= editorLevel) {
      return NextResponse.json({ error: 'Não pode atribuir role igual ou superior à sua' }, { status: 403 })
    }
  }

  const updateData: any = {}
  if (role) updateData.role = role
  if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions)

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, permissions: true },
  })

  return NextResponse.json({ data: updated })
}
