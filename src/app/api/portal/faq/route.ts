import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

const DEFAULT_FAQS = [
  { question: 'Como acompanho o andamento do meu projeto?', answer: 'Você pode acompanhar o progresso pelo Portal do Cliente na seção "Meus Projetos". Lá você encontra atualizações, percentual de conclusão e timeline detalhada.' },
  { question: 'Como abro um chamado de suporte?', answer: 'Acesse a seção "Tickets" no portal e clique em "Novo Ticket". Descreva o problema e selecione a prioridade. Nossa equipe responderá em até 24h úteis.' },
  { question: 'Onde vejo minhas faturas?', answer: 'Na seção "Financeiro" do portal você encontra todas as faturas, com status (paga/pendente/vencida) e pode fazer o download dos comprovantes.' },
  { question: 'Como funciona o processo de aprovação?', answer: 'Quando há uma entrega ou atualização que precisa da sua aprovação, você recebe uma notificação no portal. Basta revisar e clicar em "Aprovar" ou "Solicitar ajustes".' },
  { question: 'Posso alterar o escopo do projeto?', answer: 'Sim! Entre em contato pelo chat do portal ou abra um ticket solicitando a alteração. Nossa equipe avaliará o impacto no prazo e orçamento e enviará uma proposta de aditivo.' },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const clientId = user.id
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const tickets = await prisma.ticket.findMany({
      where: {
        creatorId: clientId,
        status: 'RESOLVED',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const ticketTitles = tickets.map(t => t.title)

    if (ticketTitles.length < 5) {
      return NextResponse.json({ faqs: DEFAULT_FAQS })
    }

    // Group similar tickets by word frequency
    const groups: Map<string, string[]> = new Map()
    for (const title of ticketTitles) {
      const words = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      const key = words.slice(0, 3).sort().join(',')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(title)
    }

    const topGroups = Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)

    // Check cache first
    const faqs: { question: string; answer: string }[] = []
    const now = new Date()

    for (const [_, titles] of topGroups) {
      const representativeQ = titles[0]
      const questionKey = representativeQ.toLowerCase().slice(0, 100)

      const cached = await prisma.faqCache.findFirst({
        where: { question: questionKey, expiresAt: { gt: now } },
      })

      if (cached) {
        faqs.push({ question: representativeQ, answer: cached.answer })
      } else {
        try {
          const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{
                role: 'user',
                content: `Crie uma resposta de FAQ para esta duvida comum: "${representativeQ}". Responda em portugues brasileiro, de forma profissional e concisa, em no maximo 3 frases.`,
              }],
              max_tokens: 300,
              temperature: 0.7,
            }),
          })

          const aiJson = await aiResponse.json()
          const answer = aiJson.choices?.[0]?.message?.content || 'Entre em contato com nosso suporte para mais informacoes.'

          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7)

          await prisma.faqCache.create({
            data: { question: questionKey, answer, expiresAt },
          })

          faqs.push({ question: representativeQ, answer })
        } catch {
          faqs.push({ question: representativeQ, answer: 'Entre em contato com nosso suporte para mais informacoes sobre este topico.' })
        }
      }
    }

    return NextResponse.json({ faqs: faqs.length > 0 ? faqs : DEFAULT_FAQS })
  } catch (error) {
    console.error('[faq] Error:', error)
    return NextResponse.json({ faqs: DEFAULT_FAQS })
  }
}
