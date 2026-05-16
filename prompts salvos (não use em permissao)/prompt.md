# ANDERFLOW — PROMPT COMPLETO DE CORREÇÃO E MELHORIAS

> Stack: Next.js 14 App Router · Prisma (SQLite→PostgreSQL) · NextAuth JWT · Tailwind CSS · Radix UI · Zustand · Sonner · Socket.IO · TypeScript

---

## CONTEXTO GERAL

Este é um SaaS premium de gestão de projetos chamado ANDERFLOW. O sistema possui:
- Painel Admin (23 páginas) — acesso pelo role `ADMIN`
- Portal do Cliente (8 páginas) — acesso pelo role `CLIENT`
- 14 rotas API em `/src/app/api/`
- Design system próprio com CSS custom properties (dark mode por padrão)
- Banco SQLite em dev, PostgreSQL em produção

**Regra absoluta**: nada pode ser perdido. Tudo que existia deve continuar funcionando. Apenas corrija, melhore e adicione. Sempre salve no banco de dados via Prisma.

---

## PARTE 1 — CORREÇÕES CRÍTICAS DE BUGS

### 1.1 — Notificações não aparecem no Header

**Arquivo**: `src/components/layout/header.tsx`

**Problema**: O fetch `/api/notifications?unread=true` retorna dados mas o estado `unreadItems` não atualiza corretamente o carrossel e o badge.

**Correção**:
```ts
// Garantir que o useEffect re-execute quando session.user.id mudar
// Adicionar dependência correta no intervalo
// Verificar que `unreadItems.length` atualiza o badge corretamente
// O carrossel deve resetar o índice quando novos itens chegarem
// Adicionar toast quando nova notificação chegar (comparar IDs entre polls)
```

**Passos**:
1. No `header.tsx`, mover o array `unreadItems` para um ref anterior e comparar com o novo fetch para detectar notificações novas
2. Quando houver nova notificação detectada, disparar `toast.info(n.title)` via Sonner
3. Garantir que o `setCarouselIdx` reseta para 0 quando `unreadItems` mudar de tamanho
4. Adicionar `session?.user?.id` como dependência no useEffect principal
5. Corrigir o z-index do dropdown (deve ser `z-50` com `position: fixed` quando em mobile)

---

### 1.2 — Erro "Missing Description for DialogContent"

**Problema**: Todos os `<DialogContent>` sem `<DialogDescription>` geram warning no console.

**Correção**: Em `src/components/ui/dialog.tsx`, adicionar `aria-describedby={undefined}` como prop default no `DialogContent` quando `DialogDescription` não for filho:

```tsx
// Adicionar ao DialogContent:
aria-describedby={props['aria-describedby'] ?? undefined}
```

Alternativamente, adicionar `<DialogDescription className="sr-only">Dialog</DialogDescription>` invisível em todos os Dialogs que não têm descrição (clients/page.tsx, tickets/page.tsx, financial/page.tsx, crm/page.tsx, projects/[id]/page.tsx).

---

### 1.3 — Enviar Proposta dá erro (pinComponent.js "Empty token!")

**Problema**: O erro `Empty token!` e `PIN Company Discounts Provider: Error: Invalid data` vem de uma extensão de browser (PIN/desconto), não do código. Porém o Dialog de proposta ainda falha.

**Causa real**: No `src/app/(dashboard)/projects/[id]/page.tsx`, o fetch `POST /api/projects/${id}/approve` falha porque o token JWT não está sendo enviado corretamente — `getToken()` em `src/app/api/projects/[id]/approve/route.ts` retorna null em algumas configurações.

**Correção em** `src/app/api/projects/[id]/approve/route.ts`:
```ts
// Trocar getToken por getSessionUser do auth-utils
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function POST(request, { params }) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  // ... resto do código usando user.id
}
```

Fazer o mesmo em `src/app/api/projects/[id]/respond/route.ts` e `src/app/api/contracts/[id]/sign/route.ts`.

---

### 1.4 — Status "DRAFT" em projetos solicitados pelo cliente

**Problema**: Quando o cliente solicita um projeto (via briefing ou portal), o status entra como `DRAFT` (Rascunho), o que é semanticamente errado — deveria ser "Solicitação Pendente".

**Correção**:

Em `src/app/api/briefing/route.ts` (action submit) e `src/app/api/projects/route.ts` (POST pelo cliente), mudar:
```ts
status: 'DRAFT' → status: 'PENDING'
```

Em `src/lib/prisma/schema.prisma`, o campo `status` já suporta `PENDING`.

Em `src/components/ui/badge.tsx`, adicionar ao `statusConfig`:
```ts
'PENDING': { color: 'var(--warning)', label: 'Solicitação' },
```

Em todas as páginas que exibem status de projeto (`projects/page.tsx`, `dashboard/page.tsx`, `portal/page.tsx`, `portal/projects/page.tsx`), atualizar os labels:
```ts
// Antes:
p.status === 'DRAFT' ? 'Rascunho'
// Depois:
p.status === 'PENDING' ? 'Solicitação'
p.status === 'DRAFT' ? 'Rascunho' // manter para drafts internos do admin
```

Adicionar badge "NOVO" pulsante em projetos com status `PENDING` criados há menos de 48h:

```tsx
// Em projects/page.tsx (kanban card) e dashboard:
{p.status === 'PENDING' && (
  
    NOVO
  
)}
```

Adicionar coluna "Solicitações" no Kanban antes de "Rascunho":
```ts
const columns = [
  { id: 'PENDING', title: 'Solicitações', color: 'var(--warning)' },
  { id: 'DRAFT', title: 'Rascunho', color: 'var(--text-3)' },
  // ...resto
]
```

---

## PARTE 2 — UNIFICAÇÃO: CHAT + CLIENTES

### 2.1 — Criar página unificada `/clients` com aba de Chat integrada

**Objetivo**: A página `/clients` deve ter duas abas: "Clientes" (lista) e ao clicar em um cliente, abre o perfil com o chat integrado na lateral direita.

**Estrutura nova** em `src/app/(dashboard)/clients/page.tsx`:

```
┌─────────────────────────────────────────────────────┐
│ CLIENTES                            [+ Novo Cliente] │
├──────────────────┬──────────────────────────────────┤
│ Lista de Clientes│  Perfil do Cliente Selecionado    │
│ (scroll)         │  ┌────────────────────────────┐  │
│                  │  │ Info: nome, empresa, plano  │  │
│ [Avatar] Nome    │  │ Stats: projetos, faturamento │  │
│ empresa · online │  ├────────────────────────────┤  │
│                  │  │ CHAT INTEGRADO             │  │
│ [Avatar] Nome    │  │ (histórico de mensagens)   │  │
│ empresa          │  │ [input com ações]          │  │
│                  │  └────────────────────────────┘  │
└──────────────────┴──────────────────────────────────┘
```

**Implementação**:

1. Refatorar `src/app/(dashboard)/clients/page.tsx` para layout de duas colunas (lista à esquerda, detalhe+chat à direita)
2. Estado `selectedClientId` controla qual cliente está ativo
3. Ao selecionar cliente, buscar `/api/channels?clientId={id}` ou criar canal automaticamente
4. O componente de chat inline deve ser o mesmo do `/chat` mas sem a sidebar de canais
5. Remover `/clients/[id]/page.tsx` (migrar conteúdo para o painel lateral)
6. Remover `/chat/page.tsx` separado — redirecionar `/chat` para `/clients` com o canal correto aberto

**Canal automático por cliente**: em `src/app/api/clients/route.ts` (POST), criar canal automaticamente:
```ts
// Após criar o cliente:
await prisma.channel.create({
  data: {
    name: `${name} — ${company || email}`,
    type: 'direct',
    clientId: client.id, // adicionar campo clientId no schema
  }
})
```

Adicionar `clientId String?` no model `Channel` do `prisma/schema.prisma`.

---

### 2.2 — Componente de Chat Avançado

Criar `src/components/chat/advanced-chat.tsx` com as seguintes funcionalidades:

**Features**:
- Envio de texto com formatação (bold `**texto**`, italic `_texto_`, code `` `código` `` — renderizar como markdown simples)
- Envio de imagens (preview inline na conversa)
- Envio de arquivos (exibir ícone + nome + tamanho clicável)
- Deletar própria mensagem (botão aparece no hover, apenas sender pode deletar)
- Timestamp em cada mensagem (hora:minuto)
- Indicador de "online" do destinatário
- Scroll automático para última mensagem
- **Remover** botões de vídeo e ligação

**UI da barra de input**:
```
┌─────────────────────────────────────────────────────┐
│ [📎] [🖼] [B] [I] [<>]  Mensagem...        [Enviar] │
└─────────────────────────────────────────────────────┘
```

**Botões de formatação**: ao clicar, envolver o texto selecionado com markdown (`**`, `_`, `` ` ``)

**Upload de imagem**:
- Input `type="file" accept="image/*"` oculto
- Preview inline antes de enviar (usar `URL.createObjectURL`)
- Ao enviar, salvar a imagem como base64 no campo `metadata` da mensagem (para MVP sem storage externo) OU usar Cloudinary se `CLOUDINARY_API_KEY` estiver configurado
- Exibir imagem inline no balão da mensagem com `max-height: 200px; border-radius: 8px; cursor: zoom`
- Clique na imagem abre lightbox (modal simples com a imagem em tamanho maior)

**Upload de arquivo**:
- Input `type="file"` oculto para outros tipos
- Salvar metadata: `{ type: 'file', name, size, url }` no campo `metadata`
- Exibir: ícone de arquivo + nome truncado + tamanho + botão download

**Deletar mensagem**:
- Ao hover no balão, exibir botão `🗑` (apenas se `msg.senderId === session.user.id`)
- Chamar `DELETE /api/messages/{id}` (criar esse endpoint)
- Substituir o conteúdo por `<span class="italic text-muted">Mensagem apagada</span>` no cliente

**Renderizar markdown simples**:
```ts
function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
}
```

**API endpoints necessários**:
- `DELETE /api/messages/[id]/route.ts` — verificar que `senderId === userId` antes de deletar
- `GET /api/channels?clientId={id}` — buscar canal por clientId (atualizar `src/app/api/channels/route.ts`)
- `POST /api/upload/route.ts` — endpoint para upload de imagens/arquivos (salvar em `/public/uploads/` em dev ou Cloudinary em prod)

---

## PARTE 3 — BRIEFING COMPLETO NO PROJETO

### 3.1 — Enviar todas as perguntas e respostas

**Problema**: O resumo gerado em `generateSummary()` corta muitas respostas.

**Correção em** `src/app/api/briefing/route.ts`:

```ts
// No action 'submit', salvar as respostas completas:
const project = await prisma.project.create({
  data: {
    // ...
    briefing: JSON.stringify({
      answers,           // todas as respostas brutas
      template: getTemplateForCategory(categoryId),  // template com labels
      summary,           // resumo gerado
      submittedAt: new Date().toISOString(),
    }),
  }
})
```

### 3.2 — Botão "Ver briefing" no projeto

**Em** `src/app/(dashboard)/projects/[id]/page.tsx`, adicionar botão no header do projeto:

```tsx
{project.briefing && (() => {
  try {
    const briefingData = JSON.parse(project.briefing)
    return (
      <Button variant="outline" size="sm" onClick={() => setBriefingOpen(true)}>
         Ver Briefing
      
    )
  } catch { return null }
})()}
```

Criar Dialog `BriefingViewDialog` que:
1. Parseia `project.briefing` como JSON
2. Renderiza cada seção do template com a pergunta (label) e a resposta do cliente
3. Respostas de checkbox exibidas como lista de tags
4. Botão "Fechar" e "Baixar PDF" (usar `window.print()` com `@media print` estilizado)

---

## PARTE 4 — FLUXO DO PROJETO REDESENHADO

### 4.1 — Novo layout visual do fluxo

**Arquivo**: `src/components/projects/project-timeline.tsx` — substituir completamente.

**Novo design**: cards grandes horizontais em sequência vertical, com destaque visual na etapa ativa.

```
┌─────────────────────────────────────────────────────────┐
│  ETAPA ATUAL — EM ANDAMENTO                  [1/7] ●●●○○○○ │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔵 DESENVOLVIMENTO                      ████░░ 65% │  │
│  │ Codificação e implementação das funcionalidades   │  │
│  │ Prazo: 15/06/2026  ⏱ 12 dias restantes           │  │
│  │ ─────────────────────────────────────────────── │  │
│  │ 💬 Anderson Dev  [10:32]                          │  │
│  │    Implementei o módulo de pagamentos. ✓           │  │
│  │ 🖼 [imagem.png]                                    │  │
│  │ ─────────────────────────────────────────────── │  │
│  │ [📎 Anexar] [🖼 Foto] [B][I] Escrever... [Enviar] │  │
│  │ [▶ Iniciar] [⏸ Pausar] [✓ Concluir] [📅 +Prazo]  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌── ✓ CONCLUÍDO ──────────────────────────────────┐    │
│  │  ✅ Design  ·  ✅ Planejamento  ·  ✅ Briefing    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌── ⌛ PRÓXIMAS ETAPAS ───────────────────────────┐    │
│  │  ○ Testes  ·  ○ Deploy  ·  ○ Entrega             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Implementação** em `src/app/(dashboard)/projects/[id]/page.tsx`:

```tsx
// Estado das etapas com persistência no localStorage (por enquanto) + API futura
const [steps, setSteps] = useState([])

// Separar etapas em três grupos:
const completedSteps = steps.filter(s => s.status === 'completed')
const activeStep = steps.find(s => s.status === 'in_progress' || s.status === 'paused')
const pendingSteps = steps.filter(s => s.status === 'waiting')
```

**Barra de progresso de tempo** na etapa ativa:
- Calcular `(Date.now() - startTime) / (deadline - startTime) * 100`
- Cor: verde < 60%, amarelo 60–85%, vermelho > 85%
- Atualizar a cada minuto via `setInterval`

**Regras de transição de estado**:
- `waiting → in_progress`: botão "Iniciar" — só disponível se nenhuma outra etapa está `in_progress`
- `in_progress → paused`: botão "Pausar"
- `paused → in_progress`: botão "Retomar" (não "Iniciar de novo")
- `in_progress/paused → completed`: botão "Concluir"
- `completed → *`: BLOQUEADO (não pode voltar atrás)

**Registrar no histórico** (array local + futuramente API):
```ts
const logHistory = (action: string) => {
  const entry = {
    time: new Date().toLocaleString('pt-BR'),
    action,
    author: session?.user?.name || 'Admin',
  }
  setHistory(prev => [entry, ...prev])
  // Salvar no localStorage
  localStorage.setItem(`history_${id}`, JSON.stringify([entry, ...history]))
}
```

**Mensagens por etapa** — integrar o `AdvancedChat` dentro de cada card de etapa:
- Canal: `step_{projectId}_{stepId}` criado automaticamente
- Exibir só as mensagens desse canal dentro do card
- Admin/dev envia com seu nome destacado
- Cliente pode ver e responder

**Botão "Aumentar Prazo"**:
```tsx

  
    Estender Prazo
    
      Informe a nova data de conclusão para esta etapa:
      <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} />
      <textarea className="w-full h-20 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm" placeholder="Motivo do atraso (será enviado ao cliente)..." value={extendReason} onChange={e => setExtendReason(e.target.value)} />
    
    
      Confirmar novo prazo
    
  

```

Ao confirmar:
1. Atualizar o prazo da etapa no localStorage (e futuramente no banco)
2. Criar notificação para o cliente: `"O prazo da etapa '{stepName}' foi estendido para {newDate}. Motivo: {reason}"`
3. Registrar no histórico: `"Prazo estendido: {oldDate} → {newDate}"`
4. Destacar visualmente a etapa com badge laranja "PRAZO AJUSTADO"

**Histórico aprimorado**:
- Salvar e carregar do `localStorage` com chave `project_history_{projectId}`
- Exibir data e hora completas (`dd/MM/yyyy HH:mm:ss`)
- Ícones por tipo de ação: 🟢 Iniciado | ⏸ Pausado | ✅ Concluído | 📅 Prazo ajustado | 💬 Comentário | 🖼 Imagem enviada
- Mostrar nome do autor de cada ação

---

### 4.2 — Header do projeto melhorado

No topo da página de projeto, substituir o layout atual por:

```tsx

  
    {/* Nome do projeto em destaque */}
    
      {project.name}
    
    {/* Nome do cliente em destaque */}
    
      
        {project.client?.name[0]}
      
      
        {project.client?.name}
      
      ·
      {project.client?.company}
    
  
  {/* Botões de ação */}
  
    <Button variant="outline" size="sm" onClick={() => setBriefingOpen(true)}>
      Ver Briefing
    
    {isAdmin && isDraft_or_pending && (
      <Button size="sm" onClick={() => setApproveOpen(true)}>
        Enviar Proposta
      
    )}
  

```

---

## PARTE 5 — CONTRATO DIGITAL

### 5.1 — Fluxo correto de assinatura

**Fluxo esperado**:
1. Admin envia proposta → cliente aceita → **contrato é gerado automaticamente**
2. Cliente vê o contrato em `/portal/contracts` e no projeto
3. Botão "Baixar PDF" para o cliente baixar o contrato
4. Botão "Upload assinado" para o cliente anexar o PDF assinado via Gov.br
5. Admin é notificado quando o contrato é anexado
6. Admin aprova o anexo → contrato marcado como `ACTIVE` → projeto inicia (`IN_PROGRESS`)

**Implementação**:

Em `src/app/api/projects/[id]/respond/route.ts` (action: accept), o contrato já é criado — verificar que `status` é `DRAFT` e não `PENDING_SIGNATURE`. Corrigir:
```ts
await prisma.contract.create({
  data: {
    status: 'PENDING_SIGNATURE', // ← corrigir
    // ...
  }
})
```

Criar `src/app/api/contracts/[id]/upload/route.ts`:
```ts
// POST — cliente faz upload do contrato assinado
// Body: { signedUrl: string, fileName: string }
// Verifica que req.user.id === contract.clientId
// Atualiza: contract.signatureUrl = signedUrl, contract.status = 'ACTIVE'
// Notifica admins
// Atualiza project.status = 'IN_PROGRESS', project.contractSignedAt = new Date()
```

Criar `src/app/portal/contracts/page.tsx` completo:
```tsx
// Listar contratos do cliente autenticado
// Para cada contrato com status PENDING_SIGNATURE:
//   - Botão "Baixar PDF" → gera PDF via window.print() ou link para /api/contracts/[id]/pdf
//   - Botão "Enviar assinado" → abre modal de upload de arquivo
// Para contratos ACTIVE: exibir badge verde e link para ver o PDF assinado
```

---

## PARTE 6 — HEADER DO PAINEL: PROGRESSO DO PROJETO ATIVO (PARA CLIENTE)

**Arquivo**: `src/components/layout/header.tsx`

**Para clientes** (`role === 'CLIENT'`), no lugar do carrossel de notificações na barra de topo, exibir o progresso do projeto ativo com animação:

```tsx
// Buscar projeto ativo do cliente: GET /api/projects?status=IN_PROGRESS&limit=1
const [activeProject, setActiveProject] = useState(null)

useEffect(() => {
  if (role === 'CLIENT') {
    fetch('/api/projects?status=IN_PROGRESS')
      .then(r => r.json())
      .then(json => {
        const first = (json.data || [])[0]
        if (first) setActiveProject(first)
      })
  }
}, [role])

// Renderização no header (apenas para CLIENT):
{role === 'CLIENT' && activeProject && (
  
    
      
        {activeProject.name}
        {activeProject.progress}%
      
      {/* Barra de progresso animada */}
      
        
          {/* Shimmer effect */}
          
        
      
    
    {/* Indicador pulsante */}
    
      
      Em andamento
    
  
)}
```

Adicionar ao `globals.css`:
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

---

## PARTE 7 — ANIMAÇÕES E MELHORIAS VISUAIS GERAIS

### 7.1 — Animações de entrada de página

Em `src/app/globals.css`, adicionar/melhorar:
```css
@keyframes pageSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cardPop {
  0% { opacity: 0; transform: scale(0.97) translateY(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232,98,42,0.4); }
  50% { box-shadow: 0 0 0 6px rgba(232,98,42,0); }
}

.animate-page-enter { animation: pageSlideIn 250ms ease-out both; }
.animate-card-pop { animation: cardPop 200ms ease-out both; }
.badge-new { animation: statusPulse 2s ease-in-out infinite; }
```

Aplicar `animate-card-pop` com `animation-delay` escalonado nos cards das listas (clients, projects, crm):
```tsx
// Map com index para delay
{items.map((item, i) => (
  
```

### 7.2 — Melhorar KPI cards do Dashboard

Substituir os cards simples por versão com spark-line ou ícone animado:

```tsx
// Em dashboard/page.tsx, adicionar micro-chart de tendência em cada StatCard
// Usar recharts SparkLine (LineChart com width=80, height=30, sem eixos)
// Dados simulados por enquanto (últimos 7 dias)
const trendData = [65, 70, 68, 75, 72, 80, 85].map((v, i) => ({ i, v }))
```

### 7.3 — Skeleton melhorado

Adicionar classe `animate-shimmer` ao Skeleton para efeito de shimmer brilhante:
```css
@keyframes shimmerSkeleton {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-3) 50%, var(--surface-hover) 75%);
  background-size: 200% 100%;
  animation: shimmerSkeleton 1.5s ease-in-out infinite;
}
```

---

## PARTE 8 — MELHORIAS DE ESTRUTURA E ORGANIZAÇÃO

### 8.1 — Sidebar: reorganizar itens

Em `src/components/layout/sidebar-client.tsx`, reorganizar `adminNavItems` agrupados por seção:

```tsx
const adminNavSections = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: IconDashboard },
      { name: 'Projetos', href: '/projects', icon: IconProject },
      { name: 'Clientes', href: '/clients', icon: IconClient }, // unifica chat
    ]
  },
  {
    label: 'Vendas',
    items: [
      { name: 'CRM', href: '/crm', icon: IconCRM },
      { name: 'Financeiro', href: '/financial', icon: IconFinancial },
      { name: 'Contratos', href: '/contracts', icon: IconFile },
    ]
  },
  {
    label: 'Análise',
    items: [
      { name: 'Analytics', href: '/analytics', icon: IconAnalytics },
      { name: 'Tickets', href: '/tickets', icon: IconTicket },
    ]
  }
]
```

Renderizar com separador entre grupos e label de seção (visível apenas quando não collapsed):
```tsx
{adminNavSections.map(section => (
  
    {!collapsed && (
      
        {section.label}
      
    )}
    {section.items.map(item => )}
  
))}
```

### 8.2 — Remover página /chat separada

Em `src/middleware.ts`, adicionar redirect de `/chat` para `/clients`:
```ts
if (path === '/chat' || path.startsWith('/chat/')) {
  return NextResponse.redirect(new URL('/clients', req.url))
}
```

### 8.3 — Adicionar campo `clientId` no model Channel

Em `prisma/schema.prisma`, no model `Channel`:
```prisma
model Channel {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        String   @default("project")
  isPrivate   Boolean  @default(false)
  clientId    String?  // ← ADICIONAR
  createdAt   DateTime @default(now())

  messages Message[]
  client   User?    @relation("ClientChannel", fields: [clientId], references: [id])
}
```

Adicionar na model `User`:
```prisma
clientChannels Channel[] @relation("ClientChannel")
```

Rodar `npx prisma db push` após as mudanças.

---

## PARTE 9 — ENDPOINT FALTANTES

### 9.1 — DELETE /api/messages/[id]

Criar `src/app/api/messages/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function DELETE(request: NextRequest, { params }: { params: Promise }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    
    const { id } = await params
    const message = await prisma.message.findUnique({ where: { id } })
    if (!message) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
    if (message.senderId !== token.id) return NextResponse.json({ error: 'Apenas o autor pode deletar' }, { status: 403 })
    
    await prisma.message.update({
      where: { id },
      data: { content: '🚫 Mensagem apagada', type: 'deleted', isEdited: true }
    })
    return NextResponse.json({ message: 'Mensagem apagada' })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
```

### 9.2 — GET /api/channels com suporte a clientId

Em `src/app/api/channels/route.ts`, atualizar GET:
```ts
const clientId = searchParams.get('clientId')
const where: any = {}
if (clientId) where.clientId = clientId

const channels = await prisma.channel.findMany({
  where,
  orderBy: { createdAt: 'desc' },
})
```

### 9.3 — POST /api/upload

Criar `src/app/api/upload/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    // Criar diretório se não existir
    await writeFile(path.join(uploadDir, filename), buffer).catch(async () => {
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)
    })
    
    return NextResponse.json({
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

Adicionar `/public/uploads/` ao `.gitignore`.

---

## PARTE 10 — CHECKLIST FINAL DE VALIDAÇÃO

Após implementar todas as mudanças acima, verificar:

- [ ] `npx prisma db push` executado após mudanças no schema
- [ ] `npx tsx prisma/seed.ts` pode ser rodado sem erros
- [ ] `/dashboard` carrega sem erros no console
- [ ] Notificações aparecem no header (badge + dropdown + carrossel)
- [ ] `/clients` exibe lista + chat integrado
- [ ] Chat permite enviar texto, imagens, arquivos e deletar mensagens
- [ ] Projetos solicitados pelo cliente entram como `PENDING` com badge "NOVO"
- [ ] Briefing completo salvo no banco e visualizável no projeto
- [ ] Fluxo do projeto exibe card da etapa ativa com progresso de tempo
- [ ] Histórico registra data/hora/autor de cada ação
- [ ] Contrato gerado automaticamente ao aceitar proposta (status `PENDING_SIGNATURE`)
- [ ] Upload de contrato assinado funcionando
- [ ] Header do cliente mostra progresso do projeto com animação shimmer
- [ ] Sidebar organizada por seções
- [ ] Sem erros `Missing Description for DialogContent` no console
- [ ] `DELETE /api/messages/[id]` funciona (apenas o autor pode deletar)
- [ ] Botões de vídeo e ligação REMOVIDOS do chat
- [ ] Botão "Aumentar Prazo" notifica o cliente
- [ ] Todos os dados persistem no banco de dados (não apenas localStorage)
- [ ] Animações `animate-card-pop`, `animate-page-enter` e `badge-new` aplicadas
- [ ] Barra de progresso animada no header para clientes

---

## NOTAS DE IMPLEMENTAÇÃO

**Ordem recomendada de execução**:
1. Schema Prisma (campo clientId em Channel) → `prisma db push`
2. Correções de API (approve, respond, sign — usar getSessionUser)
3. Status PENDING nos projetos novos
4. Endpoint DELETE /api/messages/[id] e POST /api/upload
5. Componente AdvancedChat
6. Unificação Clientes + Chat
7. Fluxo do projeto redesenhado
8. Briefing completo (salvar + visualizar)
9. Contrato (PENDING_SIGNATURE → upload assinado)
10. Header com progresso para clientes
11. Animações e melhorias visuais
12. Sidebar reorganizada
13. Testes e validação

**Importante**: Todos os dados novos (histórico de etapas, mensagens por etapa, prazos de etapas) devem ser migrados do localStorage para o banco de dados em uma segunda fase, criando as models necessárias no Prisma. Para MVP, localStorage é aceitável com a estrutura já preparada para migração.

**Design tokens existentes** (manter consistência):
- Accent: `var(--accent)` = `#E8622A`
- Success: `var(--success)` = `#3D9A6E`
- Warning: `var(--warning)` = `#C4852A`
- Destructive: `var(--destructive)` = `#C44A3A`
- Info: `var(--info)` = `#3A7AC4`
- Background: `var(--bg)` = `#0A0A0F`
- Surface: `var(--surface)` = `#141418`

---

*Fim do prompt. Execute na ordem indicada. Não pule etapas. Salve tudo no banco.*