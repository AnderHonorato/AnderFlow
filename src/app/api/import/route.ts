import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isDeveloperOrAbove, unauthorizedResponse } from '@/lib/auth-utils'
import { z } from 'zod'

const trelloCardSchema = z.object({
  name: z.string(),
  desc: z.string().optional(),
  idList: z.string().optional(),
  due: z.string().nullable().optional(),
})

const trelloListSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const clientCsvSchema = z.object({
  nome: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  empresa: z.string().optional(),
  company: z.string().optional(),
  telefone: z.string().optional(),
  phone: z.string().optional(),
})

const anderflowExportSchema = z.object({
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    status: z.string().optional(),
    progress: z.number().optional(),
    budget: z.number().optional(),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
    })).optional(),
  })).optional(),
  clients: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
  })).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isDeveloperOrAbove(user)) return unauthorizedResponse()

  const { format, data } = await req.json()

  if (!format || !data) {
    return NextResponse.json({ error: 'Formato e dados são obrigatórios' }, { status: 400 })
  }

  const result: { created: number; ignored: number; errors: number; details: string[] } = {
    created: 0,
    ignored: 0,
    errors: 0,
    details: [],
  }

  try {
    switch (format) {
      case 'trello': {
        const parsed = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data))
        if (!parsed.lists || !parsed.cards) {
          return NextResponse.json({ error: 'JSON do Trello deve conter lists e cards' }, { status: 400 })
        }

        const lists = z.array(trelloListSchema).parse(parsed.lists)
        const cards = z.array(trelloCardSchema).parse(parsed.cards)

        const boardName = parsed.name || 'Board importado'
        const slug = boardName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)

        const project = await prisma.project.create({
          data: {
            name: boardName,
            slug: slug + '-' + Date.now().toString(36),
            status: 'DRAFT',
            type: 'WEB',
            description: parsed.desc || '',
            clientId: user.id,
          },
        })
        result.created++

        const milestones: Record<string, string> = {}
        for (const list of lists) {
          const milestone = await prisma.milestone.create({
            data: {
              name: list.name,
              projectId: project.id,
              order: lists.indexOf(list),
            },
          })
          milestones[list.id] = milestone.id
          result.created++
        }

        for (const card of cards) {
          await prisma.task.create({
            data: {
              title: card.name,
              description: card.desc || '',
              status: 'TODO',
              projectId: project.id,
              milestoneId: card.idList ? milestones[card.idList] : null,
              dueDate: card.due ? new Date(card.due) : null,
              creatorId: user.id,
            },
          })
          result.created++
        }

        result.details.push(`${project.name}: ${cards.length} cards importados como tasks`)
        break
      }

      case 'csv_clients': {
        const rows = Array.isArray(data) ? data : (typeof data === 'string' ? parseCSV(data) : [])
        if (!Array.isArray(rows) || rows.length === 0) {
          return NextResponse.json({ error: 'CSV sem dados' }, { status: 400 })
        }

        for (const row of rows) {
          try {
            const parsed = clientCsvSchema.parse(row)
            const name = parsed.nome || parsed.name
            const email = parsed.email
            const company = parsed.empresa || parsed.company
            const phone = parsed.telefone || parsed.phone

            if (!name || !email) {
              result.ignored++
              continue
            }

            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing) {
              result.ignored++
              continue
            }

            await prisma.user.create({
              data: {
                name,
                email,
                company,
                phone,
                role: 'CLIENT',
              },
            })
            result.created++
          } catch {
            result.errors++
          }
        }

        result.details.push(`Clientes: ${result.created} criados, ${result.ignored} ignorados, ${result.errors} erros`)
        break
      }

      case 'anderflow': {
        const parsed = anderflowExportSchema.parse(data)

        if (parsed.clients) {
          for (const c of parsed.clients) {
            try {
              const existing = c.email ? await prisma.user.findUnique({ where: { email: c.email } }) : null
              if (existing) { result.ignored++; continue }
              await prisma.user.create({
                data: { name: c.name, email: c.email || '', company: c.company, phone: c.phone, role: 'CLIENT' },
              })
              result.created++
            } catch { result.errors++ }
          }
        }

        if (parsed.projects) {
          for (const p of parsed.projects) {
            try {
              const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)
              const project = await prisma.project.create({
                data: {
                  name: p.name,
                  slug: slug + '-' + Date.now().toString(36),
                  description: p.description,
                  status: p.status || 'DRAFT',
                  type: 'WEB',
                  progress: p.progress || 0,
                  budget: p.budget || 0,
                  clientId: user.id,
                },
              })
              result.created++

              if (p.tasks) {
                await prisma.task.createMany({
                  data: p.tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    status: t.status || 'TODO',
                    priority: t.priority || 'MEDIUM',
                    projectId: project.id,
                    creatorId: user.id,
                  })),
                })
                result.created += p.tasks.length
              }
            } catch { result.errors++ }
          }
        }

        result.details.push(`Importação concluída: ${result.created} criados, ${result.ignored} ignorados, ${result.errors} erros`)
        break
      }

      default:
        return NextResponse.json({ error: 'Formato não suportado. Use: trello, csv_clients, anderflow' }, { status: 400 })
    }

    return NextResponse.json({ data: result })
  } catch (err: any) {
    result.details.push(`Erro: ${err.message}`)
    return NextResponse.json({ data: result, error: err.message }, { status: 422 })
  }
}

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((h, i) => { row[h] = values[i] })
    return row
  })
}
