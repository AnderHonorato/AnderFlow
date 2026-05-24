import { prisma } from '@/lib/prisma'

export async function runAutomations(trigger: string, data: Record<string, unknown>) {
  try {
    const automations = await prisma.automation.findMany({
      where: { trigger, isActive: true },
    })

    for (const automation of automations) {
      try {
        const actions = JSON.parse(automation.actions || '[]')

        for (const action of actions) {
          await executeAction(action, data)
        }

        await prisma.automation.update({
          where: { id: automation.id },
          data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        })
      } catch (err) {
        console.error(`[automation-runner] Erro na automação ${automation.id}:`, err)
      }
    }
  } catch (err) {
    console.error('[automation-runner] Erro ao buscar automações:', err)
  }
}

async function executeAction(action: Record<string, unknown>, data: Record<string, unknown>) {
  const actionType = action.type as string

  switch (actionType) {
    case 'send_notification': {
      const userId = (action.userId as string) || (data.clientId as string) || (data.userId as string)
      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: (action.title as string) || 'Notificação automática',
            message: interpolateTemplate(action.message as string || '', data),
            metadata: JSON.stringify(data),
          },
        })
      }
      break
    }

    case 'create_task': {
      const projectId = (action.projectId as string) || (data.projectId as string)
      if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } })
        await prisma.task.create({
          data: {
            title: interpolateTemplate(action.taskTitle as string || 'Tarefa automática', data),
            description: interpolateTemplate(action.taskDescription as string || '', data),
            projectId,
            priority: (action.priority as string) || 'MEDIUM',
            creatorId: (data.userId as string) || (data.creatorId as string) || project?.clientId || 'system',
          },
        })
      }
      break
    }

    case 'send_chat_message': {
      const projectId = (action.projectId as string) || (data.projectId as string)
      if (projectId) {
        await prisma.message.create({
          data: {
            content: interpolateTemplate(action.message as string || '', data),
            senderId: 'system',
            projectId,
          },
        })
      }
      break
    }

    default:
      console.log(`[automation-runner] Ação desconhecida: ${actionType}`)
  }
}

function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(data[key] ?? '')
  })
}
