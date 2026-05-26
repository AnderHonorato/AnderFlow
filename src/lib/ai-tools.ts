// ============================================
// AI TOOLS — Tool/Function definitions for DeepSeek Tool Calling
// Conecta a IA diretamente às APIs do sistema
// ============================================

import type { DeepSeekTool } from '@/lib/deepseek-types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================
// TOOL DEFINITIONS
// ============================================

export const AI_TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_projetos',
      description: 'Busca projetos do sistema ANDERFLOW com filtros opcionais. Retorna lista de projetos com nome, status, progresso e cliente.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL'],
            description: 'Filtrar por status do projeto (opcional)',
          },
          cliente_nome: {
            type: 'string',
            description: 'Nome do cliente para filtrar (opcional)',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Numero maximo de projetos a retornar (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_cliente',
      description: 'Busca dados detalhados de um cliente pelo nome, email ou ID.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Nome, email ou ID do cliente a buscar',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_tarefa',
      description: 'Cria uma nova tarefa em um projeto do ANDERFLOW.',
      parameters: {
        type: 'object',
        properties: {
          titulo: {
            type: 'string',
            description: 'Titulo da tarefa',
          },
          projeto_nome: {
            type: 'string',
            description: 'Nome do projeto onde criar a tarefa',
          },
          prioridade: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            description: 'Prioridade da tarefa',
          },
          descricao: {
            type: 'string',
            description: 'Descricao detalhada da tarefa (opcional)',
          },
        },
        required: ['titulo', 'projeto_nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumo_financeiro',
      description: 'Retorna metricas financeiras do periodo especificado: receita, faturas pendentes, inadimplencia.',
      parameters: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            enum: ['7d', '30d', '90d', '365d'],
            description: 'Periodo de analise',
          },
        },
        required: ['periodo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_tickets_abertos',
      description: 'Lista tickets de suporte em aberto no ANDERFLOW, com opcao de filtrar por prioridade.',
      parameters: {
        type: 'object',
        properties: {
          prioridade: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            description: 'Filtrar por prioridade (opcional)',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 30,
            description: 'Numero maximo de tickets (default: 5)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estatisticas_gerais',
      description: 'Retorna estatisticas gerais do ANDERFLOW: total de projetos, usuarios, tarefas, tickets e metricas resumidas.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_tarefas_projeto',
      description: 'Busca todas as tarefas de um projeto especifico com status e responsaveis.',
      parameters: {
        type: 'object',
        properties: {
          projeto_nome: {
            type: 'string',
            description: 'Nome do projeto para buscar tarefas',
          },
        },
        required: ['projeto_nome'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_faturas',
      description: 'Lista faturas do sistema com filtros de status e periodo.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
            description: 'Status da fatura (opcional)',
          },
          cliente_nome: {
            type: 'string',
            description: 'Nome do cliente para filtrar (opcional)',
          },
        },
      },
    },
  },
]

// ============================================
// TOOL EXECUTOR — executa ferramentas contra APIs reais
// ============================================

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sessionToken?: string,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sessionToken) {
    headers.Cookie = `next-auth.session-token=${sessionToken}`
  }

  switch (toolName) {
    case 'buscar_projetos': {
      const params = new URLSearchParams()
      if (args.status) params.set('status', args.status as string)
      if (args.cliente_nome) params.set('search', args.cliente_nome as string)
      if (args.limit) params.set('limit', String(args.limit))
      const res = await fetch(`${BASE_URL}/api/projects?${params}`, { headers })
      const data = await res.json()
      const projects = (data.projects || data.data || []).slice(0, (args.limit as number) || 10)
      if (!projects.length) return JSON.stringify({ message: 'Nenhum projeto encontrado.', total: 0 })
      return JSON.stringify({
        total: projects.length,
        projetos: projects.map((p: any) => ({
          nome: p.name,
          status: p.status,
          progresso: p.progress ? `${p.progress}%` : 'N/A',
          cliente: p.client?.name || p.clientName || 'N/A',
          id: p.id,
        })),
      })
    }

    case 'buscar_cliente': {
      const query = encodeURIComponent(args.query as string)
      const res = await fetch(`${BASE_URL}/api/clients?search=${query}`, { headers })
      const data = await res.json()
      const clients = data.clients || data.data || []
      if (!clients.length) return JSON.stringify({ message: 'Cliente nao encontrado.' })
      return JSON.stringify({
        encontrados: clients.length,
        clientes: clients.slice(0, 5).map((c: any) => ({
          nome: c.name,
          email: c.email,
          empresa: c.company || 'N/A',
          id: c.id,
          status: c.status || 'ATIVO',
        })),
      })
    }

    case 'criar_tarefa': {
      const projetoNome = args.projeto_nome as string
      const projRes = await fetch(`${BASE_URL}/api/projects?search=${encodeURIComponent(projetoNome)}`, { headers })
      const projData = await projRes.json()
      const projects = projData.projects || projData.data || []
      if (!projects.length) return JSON.stringify({ error: `Projeto "${projetoNome}" nao encontrado.` })

      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: args.titulo,
          description: args.descricao || '',
          projectId: projects[0].id,
          priority: args.prioridade || 'MEDIUM',
        }),
      })
      const data = await res.json()
      if (data.error) return JSON.stringify({ error: data.error })
      return JSON.stringify({
        sucesso: true,
        tarefa: {
          id: data.id || data.data?.id,
          titulo: args.titulo,
          projeto: projetoNome,
        },
      })
    }

    case 'resumo_financeiro': {
      const periodo = args.periodo || '30d'
      const res = await fetch(`${BASE_URL}/api/dashboard?period=${periodo}`, { headers })
      const data = await res.json()
      return JSON.stringify({
        periodo,
        receita: data.revenue || data.totalRevenue || 0,
        faturas_pendentes: data.pendingInvoices || 0,
        faturas_pagas: data.paidInvoices || 0,
        inadimplencia: data.overdueCount || 0,
        novos_clientes: data.newClients || 0,
        projetos_ativos: data.activeProjects || 0,
      })
    }

    case 'listar_tickets_abertos': {
      const params = new URLSearchParams()
      params.set('status', 'OPEN')
      if (args.prioridade) params.set('priority', args.prioridade as string)
      if (args.limit) params.set('limit', String(args.limit))
      const res = await fetch(`${BASE_URL}/api/tickets?${params}`, { headers })
      const data = await res.json()
      const tickets = (data.tickets || data.data || []).slice(0, (args.limit as number) || 5)
      if (!tickets.length) return JSON.stringify({ message: 'Nenhum ticket aberto encontrado.', total: 0 })
      return JSON.stringify({
        total: tickets.length,
        tickets: tickets.map((t: any) => ({
          titulo: t.title,
          prioridade: t.priority || t.aiPriority || 'MEDIUM',
          categoria: t.category || t.aiCategory || 'NAO_CLASSIFICADO',
          id: t.id,
          criado_em: t.createdAt,
        })),
      })
    }

    case 'estatisticas_gerais': {
      const [projRes, ticketRes, taskRes, userRes] = await Promise.all([
        fetch(`${BASE_URL}/api/projects?limit=1`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${BASE_URL}/api/tickets?limit=1`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${BASE_URL}/api/tasks?limit=1`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${BASE_URL}/api/users?limit=1`, { headers }).then(r => r.json()).catch(() => ({})),
      ])
      return JSON.stringify({
        total_projetos: projRes.total || projRes.count || 0,
        total_tickets: ticketRes.total || ticketRes.count || 0,
        total_tarefas: taskRes.total || taskRes.count || 0,
        total_usuarios: userRes.total || userRes.count || 0,
      })
    }

    case 'buscar_tarefas_projeto': {
      const projetoNome = args.projeto_nome as string
      const projRes = await fetch(`${BASE_URL}/api/projects?search=${encodeURIComponent(projetoNome)}`, { headers })
      const projData = await projRes.json()
      const projects = projData.projects || projData.data || []
      if (!projects.length) return JSON.stringify({ error: `Projeto "${projetoNome}" nao encontrado.` })

      const taskRes = await fetch(`${BASE_URL}/api/tasks?projectId=${projects[0].id}`, { headers })
      const taskData = await taskRes.json()
      const tasks = taskData.tasks || taskData.data || []
      return JSON.stringify({
        projeto: projetoNome,
        total_tarefas: tasks.length,
        tarefas: tasks.map((t: any) => ({
          titulo: t.title,
          status: t.status,
          prioridade: t.priority,
          responsavel: t.assignee?.name || t.assigneeName || 'Nao atribuido',
        })),
      })
    }

    case 'listar_faturas': {
      const params = new URLSearchParams()
      if (args.status) params.set('status', args.status as string)
      if (args.cliente_nome) params.set('search', args.cliente_nome as string)
      const res = await fetch(`${BASE_URL}/api/invoices?${params}`, { headers })
      const data = await res.json()
      const invoices = (data.invoices || data.data || []).slice(0, 20)
      if (!invoices.length) return JSON.stringify({ message: 'Nenhuma fatura encontrada.', total: 0 })
      return JSON.stringify({
        total: invoices.length,
        faturas: invoices.map((i: any) => ({
          valor: i.amount || i.value,
          status: i.status,
          vencimento: i.dueDate,
          cliente: i.client?.name || i.clientName || 'N/A',
        })),
      })
    }

    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` })
  }
}

// ============================================
// TOOL RESULT FORMATTER
// ============================================

export function formatToolResultsForAI(
  toolName: string,
  result: string,
): string {
  try {
    const parsed = JSON.parse(result)
    if (parsed.error) return `Erro ao executar ${toolName}: ${parsed.error}`
    return `Resultado de ${toolName}:\n${JSON.stringify(parsed, null, 2)}`
  } catch {
    return `Resultado de ${toolName}: ${result}`
  }
}
