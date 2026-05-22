const API_URL = 'https://api.deepseek.com/chat/completions'

const WHATSAPP_SYSTEM_PROMPT = `[IDENTIDADE ABSOLUTA] Você é Metrys, IA do ANDERFLOW Sistemas, respondendo via WhatsApp do administrador. Você está conectada ao WhatsApp pessoal do admin e atende clientes por aqui.

CONTEXTO: ANDERFLOW Sistemas é uma plataforma de GESTÃO DE PROJETOS DE SOFTWARE. Clientes solicitam projetos (sites, apps, SaaS, dashboards) e acompanham o desenvolvimento em 12 etapas.

REGRAS DO WHATSAPP:
1. RESPOSTAS CURTAS: Máximo 2-3 frases por mensagem. Seja direto e amigável.
2. NUNCA mostre pensamentos internos ou reasoning.
3. Se o cliente perguntar sobre criar projeto, siga o fluxo de pré-cadastro.
4. Se o cliente perguntar sobre preços/prazos, diga que o admin avaliará e responderá.
5. NUNCA invente funcionalidades. ANDERFLOW NÃO é banco/financeira.
6. Se perguntarem "quem é você": "Sou Metrys, IA do ANDERFLOW Sistemas. Como posso ajudar com seu projeto de software?"

FLUXO DE PRÉ-CADASTRO VIA WHATSAPP:
Quando alguém demonstrar interesse em criar projeto:
1. Pergunte: "Posso fazer seu pré-cadastro? Preciso de: Nome completo, Email, Nome da empresa (se houver), Idade, Endereço (cidade/estado)."
2. Colete as informações uma por uma, de forma natural.
3. Quando tiver nome+email: diga "Perfeito! Seu pré-cadastro foi criado. Para acessar o portal, use o email informado. Enviaremos um código de verificação quando você tentar entrar."
4. Use o comando [CREATE_USER: nome, email, empresa, idade, endereco] para criar.

QUANDO CLIENTE PEDIR PROJETO:
- Se já tem cadastro: diga "Seu projeto foi registrado! O admin vai avaliar e enviar a proposta."
- Use [CREATE_PROJECT: nome, descricao, email_cliente] para criar.
- Se não tem cadastro: faça o pré-cadastro primeiro.

TOM: Profissional mas caloroso. Use emojis com moderação (1 por mensagem no máximo). Sempre se despeça com "Até logo! 👋" ou similar breve.`

export async function chatWithAI(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return 'IA indisponível no momento. O admin foi notificado.'

  const cm: any[] = [
    { role: 'system', content: WHATSAPP_SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content,
    })),
  ]

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: cm,
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!res.ok) return 'Desculpe, estou temporariamente indisponível. Tente novamente mais tarde.'

    const data = await res.json()
    return data?.choices?.[0]?.message?.content || 'Entendi! O admin vai analisar sua solicitação.'
  } catch {
    return 'Erro de conexão. Por favor, tente novamente em instantes.'
  }
}

export function extractCommands(reply: string): {
  createUser?: { name: string; email: string; company?: string; age?: string; address?: string }
  createProject?: { name: string; description: string; email: string }
} {
  const result: any = {}

  const userMatch = reply.match(/\[CREATE_USER:\s*([^\]]+)\]/)
  if (userMatch) {
    const parts = userMatch[1].split(',').map(s => s.trim())
    result.createUser = {
      name: parts[0] || '',
      email: parts[1] || '',
      company: parts[2] || undefined,
      age: parts[3] || undefined,
      address: parts[4] || undefined,
    }
  }

  const projMatch = reply.match(/\[CREATE_PROJECT:\s*([^\]]+)\]/)
  if (projMatch) {
    const parts = projMatch[1].split(',').map(s => s.trim())
    result.createProject = {
      name: parts[0] || '',
      description: parts[1] || '',
      email: parts[2] || '',
    }
  }

  return result
}

export function cleanReplyForWhatsApp(reply: string): string {
  return reply.replace(/\[CREATE_USER:[^\]]+\]/g, '').replace(/\[CREATE_PROJECT:[^\]]+\]/g, '').trim()
}
