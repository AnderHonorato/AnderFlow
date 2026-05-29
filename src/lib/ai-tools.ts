// ============================================
// AI TOOLS — Tool/Function definitions for DeepSeek Tool Calling
// Conecta a IA diretamente as APIs do sistema
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
      description: 'Busca projetos do sistema ANDERFLOW com filtros opcionais. Retorna lista de projetos com nome, status, progresso, cliente e ID.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ativo', 'pausado', 'concluido', 'cancelado'],
            description: 'Filtrar por status do projeto. ativo=IN_PROGRESS, pausado=PENDING, concluido=COMPLETED, cancelado=CANCELLED',
          },
          cliente_id: {
            type: 'string',
            description: 'ID do cliente para filtrar projetos (opcional)',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Numero maximo de projetos a retornar. Default: 10',
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
          projeto_id: {
            type: 'string',
            description: 'ID do projeto onde criar a tarefa',
          },
          prioridade: {
            type: 'string',
            enum: ['baixa', 'media', 'alta', 'urgente'],
            description: 'Prioridade da tarefa. baixa=LOW, media=MEDIUM, alta=HIGH, urgente=HIGH',
          },
          descricao: {
            type: 'string',
            description: 'Descricao detalhada da tarefa (opcional)',
          },
        },
        required: ['titulo', 'projeto_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumo_financeiro',
      description: 'Retorna metricas financeiras do periodo especificado: receita total, faturas pendentes, inadimplencia, projetos ativos, clientes ativos.',
      parameters: {
        type: 'object',
        properties: {
          periodo: {
            type: 'string',
            enum: ['7d', '30d', '90d', '365d'],
            description: 'Periodo de analise financeira',
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
      description: 'Lista tickets de suporte em aberto com prioridade e categoria.',
      parameters: {
        type: 'object',
        properties: {
          prioridade: {
            type: 'string',
            enum: ['baixa', 'media', 'alta', 'critica'],
            description: 'Filtrar por prioridade (opcional). baixa=LOW, media=MEDIUM, alta=HIGH, critica=HIGH',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 30,
            description: 'Numero maximo de tickets. Default: 5',
          },
        },
      },
    },
  },
]

export const PROGRAMMER_TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'listar_arquivos',
      description: 'Lista arquivos e diretorios do projeto ANDERFLOW.',
      parameters: {
        type: 'object',
        properties: {
          caminho: {
            type: 'string',
            description: 'Caminho relativo a raiz do projeto. Ex: "src/app", "prisma". Vazio = raiz.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ler_arquivo',
      description: 'Le o conteudo de um arquivo do projeto.',
      parameters: {
        type: 'object',
        properties: {
          caminho: {
            type: 'string',
            description: 'Caminho relativo do arquivo. Ex: "src/lib/deepseek.ts", "package.json".',
          },
        },
        required: ['caminho'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escrever_arquivo',
      description: 'Cria ou sobrescreve um arquivo no projeto ANDERFLOW.',
      parameters: {
        type: 'object',
        properties: {
          caminho: {
            type: 'string',
            description: 'Caminho relativo do arquivo a criar/editar. Ex: "src/components/novo.tsx".',
          },
          conteudo: {
            type: 'string',
            description: 'Conteudo completo do arquivo a ser escrito.',
          },
        },
        required: ['caminho', 'conteudo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'executar_comando',
      description: 'Executa um comando de terminal na raiz do projeto ANDERFLOW. Use para: npm install, git status, rodar testes, build, lint, etc.',
      parameters: {
        type: 'object',
        properties: {
          comando: {
            type: 'string',
            description: 'Comando shell a executar. Ex: "npx tsc --noEmit", "git log --oneline -5", "npm run dev".',
          },
        },
        required: ['comando'],
      },
    },
  },
]

// ============================================
// STATUS MAPPING (user-friendly → API values)
// ============================================

const STATUS_MAP: Record<string, string> = {
  ativo: 'IN_PROGRESS',
  pausado: 'PENDING',
  concluido: 'COMPLETED',
  cancelado: 'CANCELLED',
}

const PRIORITY_MAP: Record<string, string> = {
  baixa: 'LOW',
  media: 'MEDIUM',
  alta: 'HIGH',
  urgente: 'HIGH',
  critica: 'HIGH',
}

// ============================================
// TOOL EXECUTOR
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

  try {
    switch (toolName) {
      case 'buscar_projetos': {
        const params = new URLSearchParams()
        const mappedStatus = args.status ? STATUS_MAP[args.status as string] : undefined
        if (mappedStatus) params.set('status', mappedStatus)
        if (args.limit) params.set('limit', String(args.limit))
        const url = `${BASE_URL}/api/projects${params.toString() ? '?' + params.toString() : ''}`
        const res = await fetch(url, { headers })
        if (!res.ok) return JSON.stringify({ error: `Erro ${res.status} ao buscar projetos` })
        const data = await res.json()
        const projects = (data.projects || data.data || [])
        const clientFilter = args.cliente_id as string | undefined
        const filtered = clientFilter
          ? projects.filter((p: any) => p.client?.id === clientFilter || p.clientId === clientFilter)
          : projects
        const limited = filtered.slice(0, (args.limit as number) || 10)
        if (!limited.length) return JSON.stringify({ message: 'Nenhum projeto encontrado.', total: 0 })
        return JSON.stringify({
          total: limited.length,
          projetos: limited.map((p: any) => ({
            id: p.id,
            nome: p.name,
            status: p.status,
            progresso: p.progress != null ? `${p.progress}%` : 'N/A',
            cliente: p.client?.name || p.clientName || 'N/A',
          })),
        })
      }

      case 'buscar_cliente': {
        const query = encodeURIComponent(args.query as string)
        const res = await fetch(`${BASE_URL}/api/clients?search=${query}&limit=5`, { headers })
        if (!res.ok) return JSON.stringify({ error: `Erro ${res.status} ao buscar cliente` })
        const data = await res.json()
        const clients = data.clients || data.data || []
        if (!clients.length) return JSON.stringify({ message: 'Cliente nao encontrado.' })
        return JSON.stringify({
          encontrados: clients.length,
          clientes: clients.slice(0, 5).map((c: any) => ({
            id: c.id,
            nome: c.name,
            email: c.email,
            empresa: c.company || 'N/A',
            telefone: c.phone || 'N/A',
            plano: c.plan || 'N/A',
            ativo: c.isActive !== false,
          })),
        })
      }

      case 'criar_tarefa': {
        const projectId = args.projeto_id as string
        const res = await fetch(`${BASE_URL}/api/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: args.titulo,
            description: args.descricao || '',
            projectId,
            priority: PRIORITY_MAP[args.prioridade as string] || 'MEDIUM',
          }),
        })
        const data = await res.json()
        if (!res.ok) return JSON.stringify({ error: data.error || data.message || `Erro ${res.status} ao criar tarefa` })
        const created = data.data || data
        return JSON.stringify({
          sucesso: true,
          tarefa: {
            id: created.id,
            titulo: created.title || args.titulo,
            status: created.status,
            prioridade: created.priority,
            projeto_id: projectId,
          },
        })
      }

      case 'resumo_financeiro': {
        const periodo = args.periodo as string
        const res = await fetch(`${BASE_URL}/api/dashboard`, { headers })
        if (!res.ok) return JSON.stringify({ error: `Erro ${res.status} ao buscar metricas` })
        const data = await res.json()
        const stats = data.stats || data
        return JSON.stringify({
          periodo,
          receita_total: stats.totalRevenue || stats.receita || 0,
          receita_mes_atual: stats.paidThisMonth || 0,
          faturas_pendentes: stats.pendingRevenue || 0,
          projetos_ativos: stats.activeProjects || 0,
          clientes_ativos: stats.activeClients || 0,
          projetos_concluidos: stats.completedProjects || 0,
          taxa_conversao: stats.conversionRate
            ? `${stats.conversionRate}%`
            : 'N/A',
        })
      }

      case 'listar_tickets_abertos': {
        const params = new URLSearchParams()
        params.set('status', 'OPEN')
        if (args.prioridade) {
          params.set('priority', PRIORITY_MAP[args.prioridade as string] || '')
        }
        if (args.limit) params.set('limit', String(args.limit))
        const res = await fetch(`${BASE_URL}/api/tickets?${params}`, { headers })
        if (!res.ok) return JSON.stringify({ error: `Erro ${res.status} ao buscar tickets` })
        const data = await res.json()
        const tickets = (data.tickets || data.data || []).slice(0, (args.limit as number) || 5)
        if (!tickets.length) return JSON.stringify({ message: 'Nenhum ticket aberto encontrado.', total: 0 })
        return JSON.stringify({
          total: tickets.length,
          tickets: tickets.map((t: any) => ({
            id: t.id,
            titulo: t.title,
            prioridade: t.priority,
            categoria: t.category || t.aiCategory || 'NAO_CLASSIFICADO',
            criado_em: t.createdAt,
            criador: t.creator?.name || t.creatorName || 'N/A',
          })),
        })
      }

      case 'listar_arquivos': {
        const caminho = args.caminho as string || ''
        const res = await fetch(`${BASE_URL}/api/ai/fs`, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'list', path: caminho }),
        })
        const data = await res.json()
        if (data.error) return JSON.stringify({ error: data.error })
        return JSON.stringify({
          caminho: caminho || 'raiz',
          total: data.items?.length || 0,
          itens: (data.items || []).map((i: any) => `${i.type === 'dir' ? '[DIR]' : '[FILE]'} ${i.name} ${i.type === 'file' ? `(${i.size} bytes)` : ''}`),
        })
      }

      case 'ler_arquivo': {
        const caminho = args.caminho as string
        const res = await fetch(`${BASE_URL}/api/ai/fs`, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'read', path: caminho }),
        })
        const data = await res.json()
        if (data.error) return JSON.stringify({ error: data.error })
        return JSON.stringify({
          caminho,
          tamanho: data.size,
          truncado: data.truncated || false,
          conteudo: data.content || '',
        })
      }

      case 'escrever_arquivo': {
        const caminho = args.caminho as string
        const conteudo = args.conteudo as string
        const res = await fetch(`${BASE_URL}/api/ai/fs`, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'write', path: caminho, content: conteudo }),
        })
        const data = await res.json()
        if (data.error) return JSON.stringify({ error: data.error })
        return JSON.stringify({ sucesso: true, caminho, bytes: data.bytes })
      }

      case 'executar_comando': {
        const comando = args.comando as string
        const res = await fetch(`${BASE_URL}/api/ai/fs`, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'exec', command: comando }),
        })
        const data = await res.json()
        if (data.error) return JSON.stringify({ error: data.error })
        const output = [data.stdout, data.stderr].filter(Boolean).join('\n')
        return JSON.stringify({
          comando,
          exit_code: data.code || 0,
          saida: output.slice(0, 4000) || '(sem saida)',
          truncado: output.length > 4000,
        })
      }

      default:
        return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` })
    }
  } catch (e) {
    console.error(`[executeToolCall] ${toolName} error:`, e)
    return JSON.stringify({ error: `Falha ao executar ${toolName}: ${(e as Error).message}` })
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
