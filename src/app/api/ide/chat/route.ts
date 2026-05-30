import { NextRequest } from 'next/server'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEEPSEEK_ANTHROPIC_URL = process.env.DEEPSEEK_ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const ANTHROPIC_VERSION = '2023-06-01'
const IDE_SERVER_URL = process.env.IDE_SERVER_URL || 'http://localhost:3002'
const IDE_KEY = process.env.FS_SECRET_KEY || 'anderflow-ide-dev-key'

interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Le o conteudo de um arquivo do projeto',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Caminho relativo do arquivo' } },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Cria ou sobrescreve um arquivo',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho relativo do arquivo' },
        content: { type: 'string', description: 'Conteudo a ser escrito' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Edita um arquivo existente com substituicoes precisas',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho relativo do arquivo' },
        edits: {
          type: 'array',
          description: 'Lista de edicoes a aplicar',
          items: {
            type: 'object',
            properties: {
              oldContent: { type: 'string', description: 'Texto exato a substituir' },
              newContent: { type: 'string', description: 'Novo texto' }
            },
            required: ['oldContent', 'newContent']
          }
        }
      },
      required: ['path', 'edits']
    }
  },
  {
    name: 'create_file',
    description: 'Cria um novo arquivo ou diretorio com template opcional',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho relativo' },
        type: { type: 'string', enum: ['file', 'dir'] },
        content: { type: 'string', description: 'Conteudo (opcional)' },
        template: { type: 'string', enum: ['react-component', 'api-route', 'prisma-model', 'hook', 'util'] }
      },
      required: ['path', 'type']
    }
  },
  {
    name: 'delete_file',
    description: 'Move um arquivo para a lixeira (.ide-trash/)',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Caminho relativo do arquivo' } },
      required: ['path']
    }
  },
  {
    name: 'list_directory',
    description: 'Lista arquivos e pastas recursivamente',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Caminho da pasta' },
        recursive: { type: 'boolean', description: 'Listar recursivamente' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Busca texto em arquivos do projeto',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Termo de busca' },
        path: { type: 'string', description: 'Pasta para buscar' },
        fileTypes: { type: 'string', description: 'Extensoes separadas por virgula (.ts,.tsx)' },
        regex: { type: 'boolean', description: 'Usar regex' }
      },
      required: ['query']
    }
  },
  {
    name: 'run_command',
    description: 'Executa comando no terminal (npm, npx, git, tsc, prisma, tsx)',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Comando a executar' },
        background: { type: 'boolean', description: 'Executar em background via task queue' }
      },
      required: ['command']
    }
  },
  {
    name: 'git_status',
    description: 'Verifica status do Git (branch, mudancas, staged)',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'git_commit',
    description: 'Cria um commit no Git',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Mensagem do commit' },
        files: { type: 'array', items: { type: 'string' }, description: 'Arquivos para commit (vazio = todos staged)' }
      },
      required: ['message']
    }
  },
  {
    name: 'git_diff',
    description: 'Mostra diff de mudancas atuais',
    input_schema: {
      type: 'object',
      properties: { file: { type: 'string', description: 'Arquivo especifico (opcional)' } },
      required: []
    }
  },
  {
    name: 'get_diagnostics',
    description: 'Roda diagnostico TypeScript e ESLint',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Arquivo ou pasta para diagnosticar' } },
      required: []
    }
  },
  {
    name: 'get_file_symbols',
    description: 'Lista simbolos (funcoes, classes, variaveis) de um arquivo',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Caminho do arquivo' } },
      required: ['path']
    }
  },
  {
    name: 'create_checkpoint',
    description: 'Salva snapshot de arquivos antes de editar, permite desfazer',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome descritivo do checkpoint' },
        files: { type: 'array', items: { type: 'string' }, description: 'Arquivos para snapshot' }
      },
      required: ['name', 'files']
    }
  },
  {
    name: 'get_project_context',
    description: 'Retorna contexto do projeto (framework, dependencias, estrutura)',
    input_schema: { type: 'object', properties: {}, required: [] }
  }
]

function buildSystemPrompt(projectContext: string | null): string {
  return `Voce e um programador senior especialista integrado ao projeto AnderFlow.
Voce tem acesso total ao sistema de arquivos e pode criar, ler, editar e deletar arquivos usando as ferramentas disponiveis.

Contexto do projeto:
${projectContext || 'Nao foi possivel carregar o contexto do projeto. Use get_project_context para obter informacoes atualizadas.'}

Regras:
- SEMPRE use read_file para ler um arquivo antes de edita-lo
- SEMPRE crie um checkpoint antes de fazer multiplas edicoes
- Ao criar componentes React, use os padroes do projeto (Tailwind + TypeScript)
- Ao criar rotas API, siga a estrutura existente em src/app/api/
- Execute npm run typecheck apos mudancas de TypeScript
- Responda em portugues
- Mantenha respostas concisas e diretas
- Nao adicione comentarios a menos que sejam essenciais`
}

async function fetchProjectContext(workspaceRoot?: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'X-IDE-Key': IDE_KEY }
    if (workspaceRoot) headers['X-IDE-Workspace'] = workspaceRoot
    const res = await fetch(`${IDE_SERVER_URL}/context/project`, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return JSON.stringify(data, null, 2)
  } catch {
    return null
  }
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  operationId: string | undefined,
  workspaceRoot?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-IDE-Key': IDE_KEY
  }
  if (workspaceRoot) headers['X-IDE-Workspace'] = workspaceRoot
  if (operationId) {
    headers['X-Checkpoint-Operation-Id'] = operationId
    headers['X-Checkpoint-Name'] = name
  }

  const exec = (url: string, method: string, body?: unknown) =>
    fetch(`${IDE_SERVER_URL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

  switch (name) {
    case 'read_file': {
      const res = await fetch(`${IDE_SERVER_URL}/files/read?path=${encodeURIComponent(input.path as string)}`, { headers })
      return res.json()
    }
    case 'write_file': {
      const res = await exec('/files/write', 'POST', { path: input.path, content: input.content, createDirs: true })
      return res.json()
    }
    case 'edit_file': {
      const res = await exec('/files/edit', 'PUT', { path: input.path, edits: input.edits })
      const data = await res.json()
      return { ...data, message: `${data.changesApplied || 0} mudancas aplicadas` }
    }
    case 'create_file': {
      const res = await exec('/files/create', 'POST', input)
      return res.json()
    }
    case 'delete_file': {
      const res = await exec('/files/delete', 'DELETE', { path: input.path })
      return res.json()
    }
    case 'list_directory': {
      const params = new URLSearchParams({ path: input.path as string })
      const res = await fetch(`${IDE_SERVER_URL}/files/list?${params}`, { headers })
      const data = await res.json()
      return { totalFiles: data.totalFiles, totalSize: data.totalSize, tree: JSON.stringify(data.tree).substring(0, 2000) }
    }
    case 'search_files': {
      const params = new URLSearchParams({ query: input.query as string })
      if (input.path) params.set('path', input.path as string)
      if (input.fileTypes) params.set('fileTypes', input.fileTypes as string)
      if (input.regex) params.set('regex', 'true')
      const res = await fetch(`${IDE_SERVER_URL}/files/search?${params}`, { headers })
      const data = await res.json()
      return { total: data.total, results: (data.results || []).slice(0, 20) }
    }
    case 'run_command': {
      if (input.background) {
        const res = await exec('/tasks/create', 'POST', { name: input.command, command: input.command })
        return res.json()
      }
      const res = await exec('/terminal/run', 'POST', { command: input.command, timeout: 120000 })
      return res.json()
    }
    case 'git_status': {
      const res = await fetch(`${IDE_SERVER_URL}/git/status`, { headers })
      return res.json()
    }
    case 'git_commit': {
      if (input.files && Array.isArray(input.files) && input.files.length > 0) {
        await exec('/git/stage', 'POST', { files: input.files })
      }
      const res = await exec('/git/commit', 'POST', { message: input.message })
      return res.json()
    }
    case 'git_diff': {
      const params = input.file ? `?file=${encodeURIComponent(input.file as string)}` : ''
      const res = await fetch(`${IDE_SERVER_URL}/git/diff${params}`, { headers })
      return res.json()
    }
    case 'get_diagnostics': {
      const params = input.path ? `?path=${encodeURIComponent(input.path as string)}` : ''
      const res = await fetch(`${IDE_SERVER_URL}/lsp/diagnostics${params}`, { headers })
      return res.json()
    }
    case 'get_file_symbols': {
      const params = `?path=${encodeURIComponent(input.path as string)}`
      const res = await fetch(`${IDE_SERVER_URL}/lsp/symbols${params}`, { headers })
      return res.json()
    }
    case 'create_checkpoint': {
      const res = await exec('/checkpoint/create', 'POST', { name: input.name, files: input.files })
      return res.json()
    }
    case 'get_project_context': {
      const res = await fetch(`${IDE_SERVER_URL}/context/project`, { headers })
      return res.json()
    }
    default:
      return { error: `Ferramenta desconhecida: ${name}` }
  }
}

function convertToOpenAITools(): Record<string, unknown>[] {
  return TOOLS.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema
    }
  }))
}

function getFallbackApiUrl(): string {
  if (DEEPSEEK_API_KEY) {
    return 'https://api.deepseek.com/chat/completions'
  }
  return 'https://api.openai.com/v1/chat/completions'
}

function getActiveApiKey(model: string): { key: string; url: string; provider: string } {
  const m = model || ''
  if (m.startsWith('claude') && process.env.ANTHROPIC_API_KEY) {
    return { key: process.env.ANTHROPIC_API_KEY, url: 'https://api.anthropic.com/v1/messages', provider: 'anthropic' }
  }
  if (m.startsWith('gpt') && process.env.OPENAI_API_KEY) {
    return { key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', provider: 'openai' }
  }
  if (m.startsWith('gemini') && process.env.GOOGLE_AI_KEY) {
    return { key: process.env.GOOGLE_AI_KEY, url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`, provider: 'gemini' }
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return { key: process.env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/chat/completions', provider: 'deepseek' }
  }
  if (process.env.OPENAI_API_KEY) {
    return { key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', provider: 'openai' }
  }
  throw new Error('Nenhuma chave de API configurada')
}

async function callAI(
  messages: { role: string; content: unknown }[],
  systemPrompt: string,
  maxTokens: number,
  model: string
): Promise<Response> {
  const { key, url, provider } = getActiveApiKey(model)

  const openAIMessages: { role: string; content: unknown }[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => {
      const content = m.content
      if (Array.isArray(content)) {
        return { role: m.role, content: content.filter((c: any) => c && c.type !== 'tool_use').map((c: any) => c.type === 'text' ? c.text : '').join(' ') }
      }
      return { role: m.role, content }
    })
  ]

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: openAIMessages,
    tools: convertToOpenAITools()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
}

function streamFinishedMarker(encoder: TextEncoder, controller: ReadableStreamDefaultController<Uint8Array>) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
}

const MAX_TOOL_ITERATIONS = 15

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()
  if (!isAdmin(user)) {
    return new Response(JSON.stringify({ error: 'Acesso restrito a administradores' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const encoder = new TextEncoder()

  try {
    const body = await request.json()
    const {
      messages: inputMessages = [],
      sessionId,
      mode = 'programmer',
      model = 'deepseek-v4-flash',
      workspaceRoot
    } = body as {
      messages: { role: string; content: string | unknown }[]
      sessionId?: string
      mode?: 'programmer' | 'agent' | 'explain' | 'review' | 'normal'
      model?: string
      workspaceRoot?: string
    }

    if (!inputMessages.length) {
      return new Response(JSON.stringify({ error: 'Mensagens obrigatorias' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const projectContext = await fetchProjectContext(workspaceRoot)
    const systemPrompt = buildSystemPrompt(projectContext)

    const operationId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const messages: { role: string; content: unknown }[] = [...inputMessages]

    const allMessagesForSession = [...inputMessages]

    const stream = new ReadableStream({
      async start(controller) {
        let totalTokensUsed = 0
        let iterationCount = 0

        try {
          while (iterationCount < MAX_TOOL_ITERATIONS) {
            iterationCount++

            let apiResponse: Response
            try {
              apiResponse = await callAI(messages, systemPrompt, 8096, model)
            } catch (err: any) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Erro ao conectar com a IA' })}\n\n`))
              streamFinishedMarker(encoder, controller)
              controller.close()
              return
            }

            if (!apiResponse.ok) {
              const errText = await apiResponse.text().catch(() => '')
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `Erro API (${apiResponse.status}): ${errText.slice(0, 200)}` })}\n\n`))
              streamFinishedMarker(encoder, controller)
              controller.close()
              return
            }

            const reader = apiResponse.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            let currentContentBlockType: string | null = null
            let currentToolName = ''
            let currentToolInput = ''
            let currentAssistantContent = ''

            const enqueue = (payload: Record<string, unknown>) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
            }

            await new Promise<void>((resolveStream) => {
              async function pump() {
                try {
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                      const trimmed = line.trim()
                      if (!trimmed.startsWith('data: ')) continue
                      const data = trimmed.slice(6)
                      if (data === '[DONE]') continue

                      let parsed: any
                      try { parsed = JSON.parse(data) } catch { continue }

                      if (parsed.choices) {
                        const delta = parsed.choices?.[0]?.delta
                        const finishReason = parsed.choices?.[0]?.finish_reason

                        if (delta?.content) {
                          currentAssistantContent += delta.content
                          enqueue({ type: 'text', content: delta.content })
                        }
                        if (delta?.tool_calls) {
                          for (const tc of delta.tool_calls) {
                            if (tc.function?.name) {
                              currentToolName = tc.function.name
                              currentToolInput = tc.function.arguments || ''
                            }
                            if (tc.function?.arguments) {
                              currentToolInput = tc.function.arguments
                            }
                          }
                        }
                        if (finishReason === 'tool_calls' || finishReason === 'function_call') {
                          reader.cancel()
                          resolveStream()
                          return
                        }
                        if (finishReason === 'stop') {
                          resolveStream()
                          return
                        }
                        if (parsed.usage) {
                          totalTokensUsed += parsed.usage.total_tokens || 0
                          enqueue({ type: 'usage', tokens: { total: totalTokensUsed, ...parsed.usage } })
                        }
                        continue
                      }

                      switch (parsed.type) {
                        case 'message_start':
                          if (parsed.message?.usage) {
                            totalTokensUsed += parsed.message.usage.input_tokens || 0
                          }
                          break

                        case 'content_block_start': {
                          currentContentBlockType = parsed.content_block?.type || null
                          if (currentContentBlockType === 'tool_use') {
                            currentToolName = parsed.content_block?.name || ''
                            currentToolInput = ''
                          }
                          break
                        }

                        case 'content_block_delta': {
                          const delta = parsed.delta
                          if (currentContentBlockType === 'text_delta' && delta?.text) {
                            currentAssistantContent += delta.text
                            enqueue({ type: 'text', content: delta.text })
                          }
                          if (currentContentBlockType === 'tool_use' && delta?.partial_json) {
                            currentToolInput += delta.partial_json
                          }
                          break
                        }

                        case 'content_block_stop':
                          break

                        case 'message_delta': {
                          if (parsed.delta?.stop_reason === 'tool_use') {
                            reader.cancel()
                            resolveStream()
                            return
                          }
                          if (parsed.delta?.stop_reason === 'end_turn') {
                            resolveStream()
                            return
                          }
                          if (parsed.usage) {
                            totalTokensUsed += parsed.usage.output_tokens || 0
                            enqueue({ type: 'usage', tokens: { total: totalTokensUsed, ...parsed.usage } })
                          }
                          break
                        }

                        case 'message_stop':
                          resolveStream()
                          return

                        default:
                          break
                      }
                    }
                  }
                  reader.releaseLock()
                  resolveStream()
                } catch {
                  reader.releaseLock()
                  resolveStream()
                }
              }
              pump()
            })

            allMessagesForSession.push({ role: 'assistant', content: currentAssistantContent || '(tool calls)' })

            if (currentToolName) {
              let toolInput: Record<string, unknown> = {}
              try { toolInput = JSON.parse(currentToolInput) } catch { /* partial json, ignore */ }

              if (Object.keys(toolInput).length > 0) {
                enqueue({ type: 'tool_use', tool: currentToolName, input: toolInput })

                let toolResult: unknown
                try {
                  toolResult = await executeTool(currentToolName, toolInput, operationId, workspaceRoot)
                } catch (err: any) {
                  toolResult = { error: err.message }
                }

                enqueue({ type: 'tool_result', tool: currentToolName, result: toolResult })

                messages.push({
                  role: 'assistant',
                  content: [
                    currentAssistantContent ? { type: 'text', text: currentAssistantContent } : null,
                    { type: 'tool_use', id: `tool_${Date.now()}`, name: currentToolName, input: toolInput }
                  ].filter(Boolean)
                })

                messages.push({
                  role: 'user',
                  content: [{
                    type: 'tool_result',
                    tool_use_id: `tool_${Date.now()}`,
                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                  }]
                })

                currentToolName = ''
                currentToolInput = ''
                currentAssistantContent = ''
                continue
              }
            }

            break
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'usage', tokens: { total: totalTokensUsed } })}\n\n`))
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`))
        }

        streamFinishedMarker(encoder, controller)

        if (sessionId) {
          try {
            const sessionMessages = allMessagesForSession.map(m => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            }))
            await fetch(`${IDE_SERVER_URL}/sessions/${sessionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-IDE-Key': IDE_KEY
              },
              body: JSON.stringify({ messages: sessionMessages })
            })
          } catch { /* non-blocking */ }
        }

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
