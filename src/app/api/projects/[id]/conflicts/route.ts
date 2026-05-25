import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { where: { dueDate: { not: null } }, include: { assignee: { select: { name: true } } } } },
  })
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

  const conflicts: { type: string; severity: string; description: string; taskIds: string[] }[] = []

  const tasks = project.tasks
  const projectDeadline = project.deadline ? new Date(project.deadline) : null

  tasks.forEach(t => {
    if (projectDeadline && t.dueDate && new Date(t.dueDate) > projectDeadline) {
      conflicts.push({ type: 'deadline_exceeded', severity: 'high', description: `"${t.title}" vence após o prazo do projeto`, taskIds: [t.id] })
    }
  })

  const assigneeMap: Record<string, { name: string; tasks: typeof tasks }> = {}
  tasks.forEach(t => {
    const key = t.assigneeId || 'unassigned'
    if (!assigneeMap[key]) assigneeMap[key] = { name: t.assignee?.name || 'Não atribuído', tasks: [] }
    assigneeMap[key].tasks.push(t)
  })

  Object.entries(assigneeMap).forEach(([_id, data]) => {
    const withDates = data.tasks.filter(t => t.dueDate)
    for (let i = 0; i < withDates.length; i++) {
      for (let j = i + 1; j < withDates.length; j++) {
        const diff = Math.abs(new Date(withDates[i].dueDate!).getTime() - new Date(withDates[j].dueDate!).getTime())
        if (diff < 86400000 && withDates[i].id !== withDates[j].id) {
          conflicts.push({ type: 'assignee_overload', severity: 'medium', description: `${data.name} tem tarefas no mesmo dia: "${withDates[i].title}" e "${withDates[j].title}"`, taskIds: [withDates[i].id, withDates[j].id] })
        }
      }
    }
  })

  return NextResponse.json({ data: { conflicts: conflicts.slice(0, 20) } })
}
