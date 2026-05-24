import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { cargoEhAdmin } from '@/lib/hierarquia'

const API_URL = 'https://api.deepseek.com/chat/completions'

const models = {
  'metrys-pro': { id: 'deepseek-v4-pro', name: 'Metrys v4 Pro', isPro: true },
  'metrys-flash': { id: 'deepseek-v4-flash', name: 'Metrys v4 Flash', isPro: false },
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const existing = await prisma.user.findUnique({ where: { id: user.id } })
    if (!existing) await prisma.user.create({ data: { id: user.id, name: user.name || 'Usuario', email: user.email || `${user.id}@anderflow.local` } })

    const body = await request.json()
    const { messages, projectId, conversationId, files, replyTo, modelKey } = body as {
      messages: { role: string; content: any; msgId?: string }[]
      projectId?: string; conversationId?: string; replyTo?: string; modelKey?: string
      files?: { name: string; type: string; content: string }[]
    }

    if (!messages?.length) return NextResponse.json({ error: 'Mensagens obrigatorias' }, { status: 400 })
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'Chave de API nao configurada.', code: 'NO_KEY' }, { status: 200 })

    const model = models[modelKey as keyof typeof models] || models['metrys-pro']
    const isAdmin = cargoEhAdmin(user.role)

    let sp = `[IDENTIDADE ABSOLUTA] Voce e Metrys, IA criada exclusivamente por Anderson Honorato, integrada ao ANDERFLOW Sistemas. Anderson e o unico criador e esta sempre evoluindo o sistema para melhorar a usabilidade e trazer novas funcoes e melhorias.

SOBRE O ANDERFLOW: ANDERFLOW Sistemas e uma plataforma de GESTAO DE PROJETOS DE SOFTWARE. Nao tem NADA a ver com emprestimos, bancos, financeiras, creditos, ou qualquer servico financeiro. O ANDERFLOW ajuda clientes a solicitar e acompanhar projetos de DESENVOLVIMENTO DE SOFTWARE (sites, apps, SaaS, dashboards, etc).

IDIOMA DO PENSAMENTO: Todo o pensamento/raciocinio (reasoning) DEVE ser escrito em portugues do Brasil (pt-BR). NUNCA use ingles no pensamento. Use portugues claro e natural. A resposta final tambem em portugues.

REGRAS INQUEBRAVEIS:
1. NUNCA mencione DeepSeek, OpenAI, Anthropic, Google ou qualquer empresa terceira. Se perguntarem "qual modelo", "quem te criou", responda: "Sou Metrys, IA criada por Anderson Honorato para o ANDERFLOW Sistemas."
2. NUNCA invente funcionalidades que nao existem. ANDERFLOW NAO e banco, nao e financeira, nao da emprestimos. E uma plataforma de GESTAO DE PROJETOS DE SOFTWARE.
3. Responda APENAS sobre ANDERFLOW (gestao de projetos, briefing, etapas de desenvolvimento, contratos, etc). Recuse assuntos externos educadamente: "Sou especializado na plataforma ANDERFLOW Sistemas. Posso ajudar com duvidas sobre gestao de projetos de software, briefings e fluxos de desenvolvimento."
4. ${isAdmin ? 'Admin: acesso TOTAL a todos os dados. Informe tudo solicitado.' : 'Nao revele dados sensiveis de outros usuarios.'}
5. Para respostas com topicos muito distintos, use "---" em linha propria para separar cada topico. Use COM MODERACAO - apenas 1 ou 2 separadores no maximo. NAO repita o mesmo conteudo antes e depois do separador. Cada bloco deve ter conteudo UNICO.

ETAPAS DO FLUXO ANDERFLOW (12 etapas de desenvolvimento de software):
1. Briefing (cliente preenche requisitos)
2. Proposta/Orcamento (desenvolvedor envia valor e prazo)
3. Contrato (cliente assina digitalmente)
4. Planejamento (definicao de escopo e cronograma)
5. Design (criacao de wireframes e UI/UX)
6. Aprovacao do Design (cliente aprova layout)
7. Desenvolvimento (codificacao e implementacao)
8. Testes (qualidade e correcoes)
9. Homologacao (cliente testa em staging)
10. Deploy (publicacao em producao)
11. Entrega (apresentacao e documentacao)
12. Garantia (suporte pos-entrega 30 dias)

Usuario: ${user.name||'N/A'} (${isAdmin?'Admin':'Cliente'})
${replyTo ? `Respondendo mensagem #${replyTo}.` : ''}`

    try {
      const pwhere = isAdmin ? {} : { clientId: user.id } as any
      const ps = await prisma.project.findMany({
        where: pwhere, select: { name: true, status: true, progress: true }, orderBy: { updatedAt: 'desc' as const }, take: 10,
      })
      if (ps.length) sp += `\nProjetos: ${ps.map(p => `"${p.name}" [${p.status}] ${p.progress}%`).join(' | ')}`
    } catch {}
    if (isAdmin) {
      try {
        const uc = await prisma.user.count(); const pc = await prisma.project.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } })
        sp += `\nStats: ${uc} usuarios, ${pc} projetos ativos.`
        const us = await prisma.user.findMany({ select: { name: true, email: true, role: true }, take: 30 })
        sp += `\nUsuarios: ${us.map(u => `${u.name} (${u.email}) [${u.role}]`).join(' | ')}`
      } catch {}
    }
    if (projectId) {
      try {
        const p = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, status: true, progress: true, type: true, description: true, deadline: true, budget: true, client: { select: { name: true } } } })
        if (p) sp += `\nProjeto: ${p.name} [${p.status}] ${p.progress}% | ${p.client?.name || ''} | ${p.deadline ? 'Prazo: '+new Date(p.deadline).toLocaleDateString('pt-BR') : ''}`
      } catch {}
    }
    if (files?.length) {
      sp += '\nArquivos: ' + files.map(f => `${f.name}: ${(f.content||'').slice(0, 1500)}`).join('\n')
    }

    const cm: any[] = [{ role: 'system', content: sp }]
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user'
      if (typeof m.content === 'string') cm.push({ role, content: m.content })
      else if (Array.isArray(m.content)) cm.push({ role: 'user', content: m.content })
      else cm.push({ role: 'user', content: String(m.content) })
    }

    const bodyParams: any = {
      model: model.id,
      messages: cm,
      max_tokens: 4000,
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false,
    }

    // Remove unsupported params in thinking mode
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyParams),
    })

    if (!res.ok) {
      const et = await res.text().catch(() => '')
      const status = res.status
      const msg = status === 401 ? 'Erro de autenticacao. Verifique a chave API.' :
                  status === 402 ? 'Saldo insuficiente na API. Recarregue.' :
                  status === 429 ? 'Muitas requisicoes. Aguarde um momento.' :
                  status === 500 || status === 503 ? 'Servidor ocupado. Tente novamente em instantes.' :
                  `Erro ${status} ao processar.`
      console.error(`DeepSeek ${status}:`, et.slice(0, 300))
      return NextResponse.json({ reply: msg, code: `DS_${status}` })
    }

    const data = await res.json()
    if (data.error) {
      console.error('DeepSeek:', data.error)
      return NextResponse.json({ reply: 'Erro na API.', code: `DS_${data.error?.code || 'ERR'}` })
    }

    const reasoning = data?.choices?.[0]?.message?.reasoning_content || ''
    const reply = data?.choices?.[0]?.message?.content || ''
    console.log('[Metrys] Reasoning:', (reasoning||'').slice(0,100), '| Reply:', (reply||'').slice(0,100))

    if (!reply && !reasoning) {
      console.error('Empty reply')
      return NextResponse.json({ reply: 'Nao consegui processar. Tente novamente.', code: 'EMPTY' })
    }

    const lastMsg = messages[messages.length - 1]
    const lastText = typeof lastMsg?.content === 'string' ? lastMsg.content : '(imagem)'

    if (conversationId) {
      try {
        await prisma.aiMessage.create({ data: { conversationId, role: 'user', content: lastText } })
        const assistContent = reasoning ? `[PENSAMENTO]\n${reasoning}\n[/PENSAMENTO]\n${reply}` : reply
        await prisma.aiMessage.create({ data: { conversationId, role: 'assistant', content: assistContent } })
        const cnt = await prisma.aiMessage.count({ where: { conversationId } })
        if (cnt <= 2) await prisma.aiConversation.update({ where: { id: conversationId }, data: { title: lastText.slice(0, 50).replace(/\n/g, ' ') || 'Conversa', updatedAt: new Date() } })
        else await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
      } catch (e) { console.error('Save fail:', e) }
    }

    return NextResponse.json({ reply, reasoning, model: model.name, code: 'OK' })
  } catch (e) {
    console.error('AI chat error:', e)
    return NextResponse.json({ reply: 'Erro interno. Tente novamente.', code: 'INTERNAL' })
  }
}
