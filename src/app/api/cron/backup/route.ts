import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  // Allow the CRON_SECRET header for cron-based backup
  const cronSecret = request.headers.get('x-cron-secret')
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const { getSessionUser, isAdmin } = await import('@/lib/auth-utils')
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }
  }

  try {
    // Export main tables data
    const [
      users,
      projects,
      tasks,
      invoices,
      tickets,
      leads,
      contracts,
      notifications,
      messages,
    ] = await Promise.all([
      prisma.user.findMany({ take: 10000 }),
      prisma.project.findMany({ take: 5000 }),
      prisma.task.findMany({ take: 50000 }),
      prisma.invoice.findMany({ take: 10000 }),
      prisma.ticket.findMany({ take: 5000 }),
      prisma.lead.findMany({ take: 5000 }),
      prisma.contract.findMany({ take: 5000 }),
      prisma.notification.findMany({ take: 10000 }),
      prisma.message.findMany({ take: 10000 }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      users,
      projects,
      tasks,
      invoices,
      tickets,
      leads,
      contracts,
      notifications,
      messages,
    }

    const jsonStr = JSON.stringify(exportData)

    // Try sending via email using Resend
    if (process.env.RESEND_API_KEY && process.env.BACKUP_EMAIL) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'ANDERFLOW <noreply@anderflow.com.br>',
            to: process.env.BACKUP_EMAIL,
            subject: `Backup Diario - ${new Date().toLocaleDateString('pt-BR')}`,
            html: `<h2>Backup ANDERFLOW</h2><p>Data: ${new Date().toLocaleDateString('pt-BR')}</p><p>Usuarios: ${users.length}</p><p>Projetos: ${projects.length}</p><p>Tamanho: ${(jsonStr.length / 1024).toFixed(1)} KB</p>`,
            attachments: [{
              filename: `backup-${new Date().toISOString().split('T')[0]}.json`,
              content: Buffer.from(jsonStr).toString('base64'),
            }],
          }),
        })
      } catch (e) { console.error('[backup-email] Error:', e) }
    }

    // Log the backup
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`
    const backupHash = createHash('sha256').update(jsonStr).digest('hex').slice(0, 16)

    await prisma.backupLog.create({
      data: {
        filename: `${filename}#${backupHash}`,
        size: jsonStr.length,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      filename,
      size: jsonStr.length,
      entities: { users: users.length, projects: projects.length },
    })
  } catch (error) {
    console.error('[backup] Error:', error)
    await prisma.backupLog.create({
      data: { filename: 'error', size: 0, status: 'failed' },
    }).catch(() => {})
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 })
  }
}
