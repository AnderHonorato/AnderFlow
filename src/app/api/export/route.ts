import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const entities = (searchParams.get('entities') || '').split(',').filter(Boolean)

    if (entities.length === 0) {
      return NextResponse.json({ error: 'Nenhuma entidade selecionada' }, { status: 400 })
    }

    const zip = new JSZip()
    const promises: Promise<void>[] = []

    if (entities.includes('clients')) {
      promises.push(
        prisma.user.findMany({ where: { role: 'CLIENT' } }).then(data => {
          zip.file('clients.json', JSON.stringify(data, null, 2))
        })
      )
    }
    if (entities.includes('projects')) {
      promises.push(
        prisma.project.findMany({ where: { isArchived: false } }).then(data => {
          zip.file('projects.json', JSON.stringify(data, null, 2))
        })
      )
    }
    if (entities.includes('tasks')) {
      promises.push(
        prisma.task.findMany().then(data => {
          zip.file('tasks.json', JSON.stringify(data, null, 2))
        })
      )
    }
    if (entities.includes('tickets')) {
      promises.push(
        prisma.ticket.findMany().then(data => {
          zip.file('tickets.json', JSON.stringify(data, null, 2))
        })
      )
    }
    if (entities.includes('invoices')) {
      promises.push(
        prisma.invoice.findMany().then(data => {
          zip.file('invoices.json', JSON.stringify(data, null, 2))
        })
      )
    }
    if (entities.includes('contracts')) {
      promises.push(
        prisma.contract.findMany().then(data => {
          zip.file('contracts.json', JSON.stringify(data, null, 2))
        })
      )
    }

    await Promise.all(promises)

    const buffer = await zip.generateAsync({ type: 'nodebuffer' })
    const date = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=anderflow-export-${date}.zip`,
      },
    })
  } catch (error) {
    console.error('[export]', error)
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
  }
}
