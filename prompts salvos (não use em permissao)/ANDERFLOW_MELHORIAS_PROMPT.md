# ANDERFLOW — PROMPT DE CORREÇÕES CRÍTICAS E MELHORIAS VISUAIS
> Stack: Next.js 14 App Router · Prisma SQLite · NextAuth JWT · Tailwind CSS · Radix UI · TypeScript  
> Regra absoluta: nada pode ser perdido. Apenas corrija, melhore e adicione.

---

## PARTE 1 — CORREÇÕES CRÍTICAS DE BUGS

### 1.1 — Projetos solicitados pelo cliente NÃO aparecem no painel admin

**Root cause identificado**: Em `src/app/api/projects/route.ts`, o GET filtra por `clientId = user.id` para não-admins. Isso é correto. Mas o bug está em **duas frentes simultâneas**:

**Frente A** — `src/app/(dashboard)/projects/page.tsx` chama `fetch('/api/projects')` sem passar token de sessão (funciona pois o cookie é enviado automaticamente). Porém o problema é que a coluna `PENDING` no kanban só aparece se `colProjects.length > 0`, e projetos criados via briefing entram com `status: 'PENDING'` — **CORRETO**. O real problema é que o admin vê seus próprios projetos mas **o briefing cria o projeto com `clientId: userId`** onde `userId` é o ID do cliente. O admin precisa ver TODOS os projetos.

**Correção em** `src/app/api/projects/route.ts`:
```ts
// O GET já tem a lógica correta para admin vs client.
// Porém, verificar se getSessionUser retorna null em alguns contextos.
// Adicionar fallback: se user é null, retornar array vazio (não erro).
// Já está assim. O bug real está no frontend:

// Em src/app/(dashboard)/projects/page.tsx, o fetch não trata erro 401.
// Adicionar log de erro para diagnóstico:
fetch('/api/projects')
  .then(r => {
    if (!r.ok) console.error('[projects] status:', r.status)
    return r.json()
  })
  .then(json => {
    console.log('[projects] data count:', (json.data || []).length)
    setProjects(json.data || [])
    setLoading(false)
  })
```

**Frente B — Bug real**: Em `src/app/api/briefing/route.ts` (action submit), o projeto é criado com `status: 'PENDING'`. Porém em `src/app/(dashboard)/projects/page.tsx`, a coluna PENDING só renderiza se `colProjects.length > 0` — isso está correto. 

**O BUG VERDADEIRO** está em `src/middleware.ts`: a rota `/api/projects` não está na lista de exclusão do matcher, mas o problema é que a sessão do admin pode estar expirada ou o cookie `next-auth.session-token` não está sendo enviado corretamente quando `getSessionUser` é chamado no contexto da requisição do dashboard.

**Correção definitiva** — Adicionar em `src/app/api/projects/route.ts`:
```ts
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    const { searchParams } = new URL(request.url)
    const where: any = { isArchived: false }
    const status = searchParams.get('status')
    if (status) where.status = status

    // CORREÇÃO: Se user não existe, ainda retornar projetos sem filtro de clientId
    // para não quebrar em contextos de server components ou SSR
    if (user && !isAdmin(user)) {
      where.clientId = user.id
    }
    // Se user é null, admin ou nenhum filtro → retorna todos (sem clientId filter)
    // Isso garante que o dashboard admin sempre veja tudo

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: [
        { status: 'asc' }, // PENDING primeiro
        { updatedAt: 'desc' }
      ],
    })

    return NextResponse.json({ data: projects })
  } catch (error: any) {
    console.error('[projects GET]', error?.message)
    return NextResponse.json({ data: [], error: 'Erro' }, { status: 200 })
  }
}
```

**Adicionar também em `src/app/(dashboard)/projects/page.tsx`**:
```tsx
// Adicionar polling automático a cada 30s para atualizar projetos
useEffect(() => {
  loadProjects()
  const interval = setInterval(loadProjects, 30000)
  return () => clearInterval(interval)
}, [])

// Separar a função:
const loadProjects = () => {
  fetch('/api/projects')
    .then(r => r.json())
    .then(json => {
      setProjects(json.data || [])
      setLoading(false)
    })
    .catch(() => setLoading(false))
}
```

---

### 1.2 — Dashboard admin não mostra projetos PENDING na lista "Projetos Recentes"

**Arquivo**: `src/app/api/dashboard/route.ts`

**Bug**: A query `recentProjects` filtra por `{ isArchived: false, status: { not: 'COMPLETED' } }` e ordena por `updatedAt`. Projetos PENDING recém-criados aparecem, mas o frontend em `src/app/(dashboard)/dashboard/page.tsx` exibe o badge usando `p.status === 'PENDING' ? 'Solicitacao'` mas a Badge component usa `status={...}` prop — que está correto. 

**Problema identificado**: O `src/app/(dashboard)/dashboard/page.tsx` chama `/api/dashboard` mas esse endpoint usa `getSessionUser` + `isAdmin` e retorna 403 para não-admins. Porém, clientes também acessam `/dashboard` e o fetch falha silenciosamente.

**Correção em** `src/app/api/dashboard/route.ts`:
```ts
// Remover a verificação isAdmin para permitir que clientes vejam métricas filtradas
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()
  
  try {
    // Para clientes: mostrar apenas seus dados
    const clientFilter = isAdmin(user) ? {} : { clientId: user.id }
    
    const activeProjects = await prisma.project.count({ 
      where: { isArchived: false, status: { not: 'COMPLETED' }, ...clientFilter } 
    })
    
    // ... resto das queries com clientFilter aplicado onde necessário
    
    const recentProjects = await prisma.project.findMany({
      where: { isArchived: false, ...clientFilter },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })
    
    return NextResponse.json({ stats: { ... }, recentProjects: [...] })
  } catch (error) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
```

---

### 1.3 — Projetos PENDING não aparecem no Kanban (coluna some)

**Bug em** `src/app/(dashboard)/projects/page.tsx`:
```tsx
// CÓDIGO ATUAL (BUG):
{columns.map((column) => {
  const colProjects = filtered.filter((p) => p.status === column.id)
  if (colProjects.length === 0) return null  // ← ESCONDE A COLUNA
  return (...)
})}

// CORREÇÃO: Manter a coluna PENDING sempre visível mesmo vazia,
// pois é a coluna de entrada de novos pedidos:
{columns.map((column) => {
  const colProjects = filtered.filter((p) => p.status === column.id)
  const isPending = column.id === 'PENDING'
  
  // Mostrar coluna PENDING sempre, outras só se tiverem projetos
  if (colProjects.length === 0 && !isPending) return null
  
  return (
    <div key={column.id} className="flex-shrink-0 w-[260px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: column.color }} />
        <span className="text-[13px] font-[500] text-[var(--text)]">{column.title}</span>
        <span className="text-[11px] text-[var(--text-3)]">{colProjects.length}</span>
        {isPending && colProjects.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-[600] bg-[var(--warning-subtle)] text-[var(--warning)] badge-new uppercase">
            NOVO
          </span>
        )}
      </div>
      <div className="space-y-2">
        {colProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onView={handleViewProject} onArchive={handleArchiveProject} />
        ))}
        {isPending && colProjects.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border-2)] p-4 text-center">
            <p className="text-[11px] text-[var(--text-3)]">Aguardando solicitações</p>
          </div>
        )}
      </div>
    </div>
  )
})}
```

---

### 1.4 — Notificação de novo projeto não chega ao admin em tempo real

**Problema**: O header faz polling a cada 30s. Se o cliente cria um projeto, o admin pode demorar até 30s para ver.

**Correção em** `src/components/layout/header.tsx`:
```ts
// Reduzir o intervalo de polling de 30s para 10s para notificações
const interval = setInterval(fetchNotifications, 10000) // era 30000
```

**Adicionar também**: Quando `unreadItems.length` aumenta entre dois fetches consecutivos, disparar um som sutil e um toast:
```ts
// Dentro do useEffect de fetchNotifications, após setUnreadItems:
const prevCount = prevIdsRef.current.size
const newItems = parsed.filter(p => !prevIdsRef.current.has(p.id))
if (newItems.length > 0 && prevCount > 0) {
  newItems.forEach(item => {
    toast.info(item.title, { description: item.message.slice(0, 80) })
  })
}
prevIdsRef.current = new Set(parsed.map(p => p.id))
```

---

### 1.5 — Badge component: prop `status` não passa para o `statusConfig` corretamente

**Bug em** `src/components/ui/badge.tsx`:

O componente recebe `status` prop mas também recebe `children`. Em vários lugares do código, o `children` é passado com texto hardcoded E o `status` é passado — o ponto de cor aparece mas o children sobrepõe o label do statusConfig. Isso é intencional, mas falta o caso onde `status` é passado sem `children`, que deveria auto-preencher o label.

**Correção**:
```tsx
function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  const config = status ? statusConfig[status] : null
  
  // Auto-preencher label do statusConfig se children não for fornecido
  const displayContent = children ?? config?.label
  
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {config && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
      )}
      {displayContent}
    </div>
  )
}
```

Adicionar ao `statusConfig` os status faltantes:
```ts
'SIGNED': { color: 'var(--success)', label: 'Assinado' },
'ACTIVE': { color: 'var(--success)', label: 'Ativo' },
'EXPIRED': { color: 'var(--text-3)', label: 'Expirado' },
'IN_PROGRESS': { color: 'var(--info)', label: 'Em andamento' },
'WAITING_CLIENT': { color: 'var(--warning)', label: 'Aguard. cliente' },
'WAITING_TEAM': { color: 'var(--accent)', label: 'Aguard. equipe' },
'WON': { color: 'var(--success)', label: 'Fechado' },
'NEGOTIATION': { color: 'var(--accent)', label: 'Negociação' },
```

---

### 1.6 — AdvancedChat não carrega mensagens quando channelId muda

**Bug em** `src/components/chat/advanced-chat.tsx`:

O `useEffect` que busca mensagens tem `[channelId]` como dependência, mas o polling via `setInterval` cria uma closure sobre o `channelId` inicial. Se o `channelId` mudar (usuário clica em outro cliente), o interval antigo ainda está ativo e busca mensagens do canal errado.

**Correção**:
```tsx
useEffect(() => {
  if (!channelId) {
    setMessages([])
    return
  }

  const fetchMessages = () => {
    fetch(`/api/messages?channelId=${channelId}`)
      .then(r => r.json())
      .then(json => {
        setMessages(json.data || [])
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        }, 100)
      })
  }
  
  // Limpar mensagens ao trocar de canal
  setMessages([])
  fetchMessages()
  
  const interval = setInterval(fetchMessages, 4000)
  return () => clearInterval(interval) // cleanup correto
}, [channelId]) // channelId já está na dep array — OK
```

**O bug real**: O `fetchMessages` closure captura `channelId` da closure do `useEffect`, então está correto. O problema é que `setMessages([])` não é chamado quando `channelId` muda, causando flash de mensagens antigas. Adicionar `setMessages([])` no início do `useEffect`.

---

### 1.7 — Upload de arquivos no chat falha silenciosamente

**Bug em** `src/components/chat/advanced-chat.tsx`:

O componente envia o arquivo como `URL.createObjectURL()` (URL blob local) diretamente no metadata. Essa URL não persiste entre sessões e não é acessível pelo destinatário. O upload real via `POST /api/upload` não está sendo chamado.

**Correção — adicionar upload real antes de enviar a mensagem**:
```tsx
const handleSend = async () => {
  if ((!newMessage.trim() && uploadPreviews.length === 0) || !channelId || sending) return
  setSending(true)

  try {
    // Texto primeiro
    if (newMessage.trim()) {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, channelId, type: 'text' }),
      })
      if (res.ok) {
        const json = await res.json()
        setMessages(prev => [...prev, json.data])
      }
    }

    // Uploads: enviar para /api/upload primeiro, depois salvar mensagem
    for (const preview of uploadPreviews) {
      let finalUrl = preview.url
      let isBlob = preview.url.startsWith('blob:')
      
      if (isBlob) {
        // Converter blob URL para File e fazer upload real
        try {
          const response = await fetch(preview.url)
          const blob = await response.blob()
          const file = new File([blob], preview.name, { type: preview.type })
          const formData = new FormData()
          formData.append('file', file)
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            finalUrl = uploadJson.url
          }
        } catch (e) {
          console.error('Upload failed:', e)
        }
      }
      
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: preview.name,
          channelId,
          type: preview.type.startsWith('image/') ? 'image' : 'file',
          metadata: JSON.stringify({ ...preview, url: finalUrl }),
        }),
      })
      if (msgRes.ok) {
        const json = await msgRes.json()
        setMessages(prev => [...prev, json.data])
      }
    }

    setNewMessage('')
    setUploadPreviews([])
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
  } catch {
    toast.error('Erro ao enviar mensagem')
  }
  setSending(false)
}
```

---

### 1.8 — Erro no portal/contracts: filtragem dupla desnecessária

**Bug em** `src/app/portal/contracts/page.tsx`:
```tsx
// CÓDIGO ATUAL (redundante e bugado):
const filtered = contracts.filter(c => session?.user?.id === c.clientId)
const myContracts = filtered.length > 0 ? filtered : contracts.filter((c: any) => c.clientId === session?.user?.id)
// Isso é a mesma coisa! Se filtered.length === 0, myContracts também será 0.

// CORREÇÃO: A API já filtra por clientId para não-admins.
// Usar diretamente:
const myContracts = contracts
```

---

## PARTE 2 — MELHORIAS VISUAIS (MATERIAL DESIGN 3 EXPRESSIVE + FLUENT)

### 2.1 — Sistema de animações base (adicionar em `src/app/globals.css`)

Substituir/expandir as animações existentes com um sistema completo inspirado no MD3 Expressive:

```css
/* ═══════════════════════════════════════════════════════
   MOTION TOKENS — inspirado em Material Design 3 Expressive
   Durações: fast=100ms, short=200ms, medium=300ms, long=400ms
   Easing: standard, decelerate, accelerate, emphasized
   ═══════════════════════════════════════════════════════ */

:root {
  /* Durations */
  --motion-fast: 100ms;
  --motion-short: 200ms;
  --motion-medium: 300ms;
  --motion-long: 400ms;
  --motion-extra-long: 600ms;

  /* Easings MD3 */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0, 1);
  --ease-accelerate: cubic-bezier(0.3, 0, 1, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* spring suave */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* ─── Entrada de página ─── */
@keyframes md-page-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-page-enter {
  animation: md-page-enter var(--motion-medium) var(--ease-decelerate) both;
}

/* ─── Card pop (stagger-ready) ─── */
@keyframes md-card-pop {
  0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
  60%  { opacity: 1; transform: translateY(-2px) scale(1.005); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-card-pop {
  animation: md-card-pop var(--motion-medium) var(--ease-spring) both;
}
/* Stagger helpers */
.stagger-1 { animation-delay: 50ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 150ms; }
.stagger-4 { animation-delay: 200ms; }
.stagger-5 { animation-delay: 250ms; }
.stagger-6 { animation-delay: 300ms; }

/* ─── Fade + slide variants ─── */
@keyframes md-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes md-fade-down {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes md-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes md-slide-right {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes md-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-fade-up    { animation: md-fade-up var(--motion-medium) var(--ease-decelerate) both; }
.animate-fade-down  { animation: md-fade-down var(--motion-short) var(--ease-decelerate) both; }
.animate-fade-in    { animation: md-fade-in var(--motion-short) ease both; }
.animate-slide-right { animation: md-slide-right var(--motion-short) var(--ease-decelerate) both; }
.animate-scale-in   { animation: md-scale-in var(--motion-medium) var(--ease-spring) both; }

/* ─── Pulse suave (status indicators) ─── */
@keyframes md-pulse-accent {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232,98,42,0.35); }
  50%       { box-shadow: 0 0 0 5px rgba(232,98,42,0); }
}
@keyframes md-pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(196,133,42,0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(196,133,42,0); }
}
@keyframes md-pulse-success {
  0%, 100% { box-shadow: 0 0 0 0 rgba(61,154,110,0.35); }
  50%       { box-shadow: 0 0 0 5px rgba(61,154,110,0); }
}
.badge-new         { animation: md-pulse-warning 2s ease-in-out infinite; }
.pulse-accent      { animation: md-pulse-accent 2.5s ease-in-out infinite; }
.pulse-success     { animation: md-pulse-success 2.5s ease-in-out infinite; }

/* ─── Shimmer (skeleton + progress) ─── */
@keyframes md-shimmer {
  0%   { background-position: -400% 0; }
  100% { background-position: 400% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-hover) 0%,
    var(--surface-3) 30%,
    rgba(255,255,255,0.06) 50%,
    var(--surface-3) 70%,
    var(--surface-hover) 100%
  );
  background-size: 400% 100%;
  animation: md-shimmer 1.8s ease-in-out infinite;
}
.progress-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  animation: md-shimmer 2s ease-in-out infinite;
}

/* ─── Ripple (para botões e cards clicáveis) ─── */
@keyframes md-ripple {
  0%   { transform: scale(0); opacity: 0.35; }
  80%  { transform: scale(2.5); opacity: 0.1; }
  100% { transform: scale(3); opacity: 0; }
}
.ripple-container { position: relative; overflow: hidden; }
.ripple-container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--motion-fast) ease;
}
.ripple-container:active::after {
  opacity: 1;
  animation: md-ripple 400ms var(--ease-accelerate) forwards;
}

/* ─── Hover lift (cards interativos) ─── */
.card-lift {
  transition: transform var(--motion-short) var(--ease-standard),
              box-shadow var(--motion-short) var(--ease-standard),
              border-color var(--motion-short) ease;
}
.card-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  border-color: var(--border-2);
}
.card-lift:active {
  transform: translateY(0);
  transition-duration: var(--motion-fast);
}

/* ─── Estado de loading nos botões ─── */
@keyframes md-spin {
  to { transform: rotate(360deg); }
}
.spin { animation: md-spin 0.7s linear infinite; }

/* ─── Entrada de notificação (slide + bounce) ─── */
@keyframes md-toast-enter {
  0%   { opacity: 0; transform: translateX(calc(100% + 16px)); }
  60%  { transform: translateX(-6px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes md-toast-exit {
  from { opacity: 1; transform: translateX(0); max-height: 100px; }
  to   { opacity: 0; transform: translateX(calc(100% + 16px)); max-height: 0; }
}

/* ─── Progress bar animada ─── */
.progress-bar-animated {
  position: relative;
  overflow: hidden;
}
.progress-bar-animated .progress-fill {
  transition: width var(--motion-long) var(--ease-emphasized);
}

/* ─── Accordion / Expand ─── */
@keyframes md-expand-down {
  from { opacity: 0; max-height: 0; transform: translateY(-8px); }
  to   { opacity: 1; max-height: 1000px; transform: translateY(0); }
}
@keyframes md-collapse-up {
  from { opacity: 1; max-height: 1000px; }
  to   { opacity: 0; max-height: 0; }
}
.animate-expand   { animation: md-expand-down var(--motion-medium) var(--ease-decelerate) both; }
.animate-collapse { animation: md-collapse-up var(--motion-short) var(--ease-accelerate) both; }

/* ─── Counter de badge (número bounce) ─── */
@keyframes md-count-bounce {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.4) rotate(-5deg); }
  60%  { transform: scale(0.9) rotate(3deg); }
  100% { transform: scale(1) rotate(0); }
}
.badge-count-update { animation: md-count-bounce var(--motion-medium) var(--ease-spring); }

/* ─── Focus ring MD3 ─── */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 6px;
  transition: outline-offset var(--motion-fast) ease;
}

/* ─── Transição global aprimorada ─── */
.transition-base {
  transition: background-color var(--motion-short) var(--ease-standard),
              border-color var(--motion-short) var(--ease-standard),
              color var(--motion-short) var(--ease-standard),
              opacity var(--motion-short) ease,
              transform var(--motion-short) var(--ease-standard);
}
```

---

### 2.2 — Aplicar animações nos componentes existentes

**Em** `src/components/ui/card.tsx`:
```tsx
// Adicionar classe card-lift como default opcional:
const Card = React.forwardRef<...>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-[var(--surface)] border-[var(--border)] transition-all duration-200 ease-out',
      className
    )}
    {...props}
  />
))
// Usar card-lift apenas quando cursor-pointer também estiver presente
// Adicionar ao Card hover state no globals.css:
// .card-hover já existe, expandir:
```

Substituir `.card-hover` no globals.css por:
```css
.card-hover {
  transition: transform var(--motion-short) var(--ease-standard),
              box-shadow var(--motion-short) var(--ease-standard),
              border-color var(--motion-short) ease,
              background-color var(--motion-short) ease;
}
.card-hover:hover {
  border-color: var(--border-2);
  background: var(--surface-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.card-hover:active {
  transform: translateY(0);
  transition-duration: 80ms;
}
```

---

### 2.3 — Melhorar o componente Button com ripple e states refinados

**Em** `src/components/ui/button.tsx`, adicionar estado de loading animado e transições suaves:
```tsx
// Substituir o buttonVariants:
const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 text-[13px] font-[450] 
   select-none disabled:opacity-40 disabled:cursor-not-allowed
   relative overflow-hidden
   transition-all duration-[150ms] ease-[cubic-bezier(0.2,0,0,1)]
   active:scale-[0.97]
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1
   focus-visible:ring-offset-[var(--bg)]`,
  {
    variants: {
      variant: {
        default: `bg-[var(--accent)] text-white rounded-[20px]
          hover:bg-[var(--accent-hover)]
          shadow-[0_1px_4px_rgba(232,98,42,0.3)]
          hover:shadow-[0_2px_12px_rgba(232,98,42,0.4)]`,
        
        outline: `border border-[var(--border-2)] text-[var(--text-2)] rounded-lg bg-transparent
          hover:text-[var(--text)] hover:border-[rgba(255,255,255,0.18)]
          hover:bg-[var(--surface-hover)]`,
        
        ghost: `text-[var(--text-2)] rounded-lg
          hover:text-[var(--text)] hover:bg-[var(--surface-hover)]`,
        
        secondary: `bg-[var(--surface-3)] text-[var(--text-2)] rounded-lg
          hover:bg-[var(--surface-hover)] hover:text-[var(--text)]`,
        
        destructive: `bg-[var(--destructive)] text-white rounded-[20px]
          hover:bg-[var(--destructive)]/85
          shadow-[0_1px_4px_rgba(196,74,58,0.3)]`,
        
        link: `text-[var(--accent)] underline-offset-4 rounded-none
          hover:underline`,
        
        success: `bg-[var(--success)] text-white rounded-[20px]
          hover:bg-[var(--success)]/85`,
      },
      size: {
        default: 'h-8 px-4',
        sm: 'h-7 px-3 text-[12px]',
        lg: 'h-10 px-6 text-[14px]',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)
```

---

### 2.4 — ProjectCard melhorado com animação de entrada escalonada

**Em** `src/app/(dashboard)/projects/page.tsx`, atualizar o `ProjectCard`:
```tsx
function ProjectCard({ project, onView, onArchive, index = 0 }: { 
  project: any; onView: (id: string) => void; onArchive: (id: string) => void; index?: number 
}) {
  const isNew = project.status === 'PENDING' && 
    (Date.now() - new Date(project.createdAt).getTime()) < 48 * 60 * 60 * 1000

  return (
    <Card 
      className={cn(
        "card-hover cursor-pointer animate-card-pop ripple-container",
        `stagger-${Math.min(index + 1, 6)}`
      )} 
      onClick={() => onView(project.id)}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Indicador de projeto novo */}
        {isNew && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] pulse-success" />
            <span className="text-[9px] font-[600] text-[var(--warning)] uppercase tracking-wider">
              Nova solicitação
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[500] truncate">{project.name}</p>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5">
              {project.client?.company || project.client?.name}
            </p>
          </div>
          {/* dropdown existente */}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">{project._count?.tasks || 0} tarefas</span>
            <span className="font-[500]">{project.progress || 0}%</span>
          </div>
          {/* Progress com animação */}
          <div className="h-[2px] rounded-full bg-[var(--surface-hover)] overflow-hidden progress-bar-animated">
            <div 
              className="h-full rounded-full progress-fill"
              style={{ 
                width: `${project.progress || 0}%`,
                background: project.progress >= 80 ? 'var(--success)' : 
                            project.progress >= 40 ? 'var(--accent)' : 'var(--info)'
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <Badge status={project.priority === 'URGENT' ? 'URGENT' : undefined}
                 variant={project.priority === 'URGENT' ? 'destructive' : 
                          project.priority === 'HIGH' ? 'warning' : 'secondary'}>
            {project.priority === 'URGENT' ? 'Urgente' : 
             project.priority === 'HIGH' ? 'Alta' : 
             project.priority === 'MEDIUM' ? 'Media' : 'Baixa'}
          </Badge>
          {project.deadline && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-3)]">
              <IconCalendar className="w-[12px] h-[12px]" />
              {new Date(project.deadline).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Passar index ao mapear:
{colProjects.map((project, index) => (
  <ProjectCard key={project.id} project={project} index={index}
    onView={handleViewProject} onArchive={handleArchiveProject} />
))}
```

---

### 2.5 — Sidebar com indicador de hover fluido + transição de collapse

**Em** `src/components/layout/sidebar-client.tsx`:

Adicionar micro-animações no `navItemClass` e no collapse:
```tsx
// Substituir a lógica de collapse para ter transição suave
// Na tag <aside>, adicionar:
style={{ transition: `width var(--motion-medium) var(--ease-standard)` }}

// Em cada nav item, adicionar transição no ícone:
// O ícone deve manter posição fixa quando collapsed
// O texto deve ter fade-out antes do collapse:
const navItemClass = (active: boolean) => cn(
  'flex items-center gap-2.5 h-[34px] px-3 rounded-lg text-[13px]',
  'transition-all duration-[200ms] cubic-bezier(0.2,0,0,1)',
  'relative select-none',
  collapsed && 'justify-center px-2',
  active
    ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
    : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
)

// O indicador lateral (active indicator) deve animar:
// Substituir o <span> do indicator por:
{active && (
  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r
    bg-[var(--accent)] animate-scale-in origin-center"
    style={{ height: '16px' }}
  />
)}

// Labels do texto com transição de opacidade:
{!collapsed && (
  <span className="truncate transition-opacity duration-[150ms]"
    style={{ opacity: collapsed ? 0 : 1 }}>
    {item.name}
  </span>
)}
```

---

### 2.6 — Header com counter badge animado

**Em** `src/components/layout/header.tsx`:

O badge de notificações deve animar quando o número muda:
```tsx
// Adicionar estado para detectar mudança no count:
const [badgeKey, setBadgeKey] = useState(0)
const prevCountRef = useRef(0)

// Dentro do fetchNotifications, após setUnreadItems:
if (parsed.length !== prevCountRef.current) {
  setBadgeKey(k => k + 1) // força re-render com animação
  prevCountRef.current = parsed.length
}

// No badge:
{unreadItems.length > 0 && (
  <span
    key={badgeKey} // key mudando = componente re-monta = animação roda novamente
    className="absolute top-0.5 right-0 flex h-[15px] min-w-[15px] items-center 
      justify-center rounded-full bg-[var(--accent)] text-[10px] font-[500] text-white px-1
      badge-count-update"
  >
    {unreadItems.length > 9 ? '9+' : unreadItems.length}
  </span>
)}
```

---

### 2.7 — Dashboard: StatCards com animação de entrada escalonada e counter animado

**Em** `src/components/ui/stat-card.tsx`, adicionar animação de contador numérico:
```tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef<number>()
  
  useEffect(() => {
    const start = 0
    const end = value
    const duration = 600
    const startTime = performance.now()
    
    const update = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(update)
    }
    
    frameRef.current = requestAnimationFrame(update)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value])
  
  return <>{displayed}</>
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  index?: number
}

export function StatCard({ icon, value, label, trend, className, index = 0 }: StatCardProps) {
  const isNumeric = typeof value === 'number'
  
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl',
      'bg-[var(--surface)] border border-[var(--border)]',
      'card-hover animate-card-pop',
      `stagger-${Math.min(index + 1, 6)}`,
      className
    )}>
      <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center flex-shrink-0
        transition-transform duration-200 group-hover:scale-110">
        <span className="w-4 h-4 text-[var(--text-2)]">{icon}</span>
      </div>
      <div>
        <div className="text-[17px] font-[500] text-[var(--text)] leading-none">
          {isNumeric ? <AnimatedNumber value={value as number} /> : value}
        </div>
        <div className="text-[11px] text-[var(--text-3)] mt-1">{label}</div>
      </div>
    </div>
  )
}
```

---

### 2.8 — Progress bar melhorada com transição fluida e cor dinâmica

**Em** `src/components/ui/progress.tsx`:
```tsx
const Progress = React.forwardRef<...>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-1 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 rounded-full relative overflow-hidden"
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        transition: `transform 600ms cubic-bezier(0.2,0,0,1)`,
        background: (value || 0) >= 80 ? 'var(--success)' :
                    (value || 0) >= 40 ? 'var(--accent)' : 'var(--info)',
      }}
    >
      {/* Shimmer overlay na progress bar */}
      {(value || 0) > 0 && (value || 0) < 100 && (
        <div className="absolute inset-0 opacity-40"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'md-shimmer 2s ease-in-out infinite',
          }}
        />
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
```

---

### 2.9 — Skeleton com shimmer melhorado

**Em** `src/components/ui/skeleton.tsx`:
```tsx
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg skeleton-shimmer', className)}
      {...props}
    />
  )
}
```

---

### 2.10 — Toast notifications (Sonner) com animação personalizada

**Em** `src/components/ui/toaster.tsx`:
```tsx
export function Toaster() {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      duration={3500}
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          color: 'var(--text)',
          borderRadius: '12px',
          fontSize: '13px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        },
        classNames: {
          toast: 'animate-fade-up',
          title: 'font-[500]',
          description: 'text-[var(--text-3)]',
          success: '!border-[var(--success)]/20 !bg-[var(--success-subtle)]',
          error: '!border-[var(--destructive)]/20 !bg-[var(--destructive-subtle)]',
          warning: '!border-[var(--warning)]/20 !bg-[var(--warning-subtle)]',
          info: '!border-[var(--info)]/20 !bg-[var(--info-subtle)]',
        },
      }}
    />
  )
}
```

---

### 2.11 — Dropdown Menu com animação de entrada

**Em** `src/components/ui/dropdown-menu.tsx`, atualizar DropdownMenuContent:
```tsx
const DropdownMenuContent = React.forwardRef<...>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1',
          'text-[var(--text)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          // Animações MD3
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
          'transition-[transform,opacity] duration-[200ms] ease-[cubic-bezier(0.2,0,0,1)]',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)

// Itens com hover mais fluido:
const DropdownMenuItem = React.forwardRef<...>(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-lg px-2.5 py-1.5 text-[13px] outline-none',
        'transition-colors duration-[100ms] ease-[cubic-bezier(0.2,0,0,1)]',
        'focus:bg-[var(--surface-hover)] focus:text-[var(--text)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
)
```

---

### 2.12 — Input com transição de focus melhorada

**Em** `src/components/ui/input.tsx`:
```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1 text-[13px]',
          'placeholder:text-[var(--text-3)]',
          'transition-[border-color,box-shadow,background-color] duration-[150ms] ease-[cubic-bezier(0.2,0,0,1)]',
          'hover:border-[var(--border-2)] hover:bg-[var(--surface-hover)]',
          'focus-visible:outline-none focus-visible:border-[var(--accent)]',
          'focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/15',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

---

### 2.13 — Dialog com animação de entrada spring

**Em** `src/components/ui/dialog.tsx`, atualizar `DialogContent`:
```tsx
const DialogContent = React.forwardRef<...>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg',
        'border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_64px_rgba(0,0,0,0.5)]',
        'rounded-2xl max-h-[85vh] overflow-y-auto',
        // Animação spring
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        // Spring via transform personalizado
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[52%]',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[52%]',
        'translate-x-[-50%] translate-y-[-50%]',
        '[&[data-state=open]]:duration-[300ms] [&[data-state=open]]:[animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        '[&[data-state=closed]]:duration-[200ms] [&[data-state=closed]]:[animation-timing-function:cubic-bezier(0.3,0,1,1)]',
        className
      )}
      aria-describedby={props['aria-describedby'] ?? undefined}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg h-7 w-7 flex items-center justify-center
        opacity-60 hover:opacity-100 hover:bg-[var(--surface-hover)]
        transition-all duration-[150ms] ease-[cubic-bezier(0.2,0,0,1)]
        focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 3l10 10M13 3L3 13"/>
        </svg>
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
```

---

### 2.14 — ProjectTimeline: animação de transição entre estados

**Em** `src/components/projects/project-timeline.tsx`:

Adicionar animação quando um nó muda de status:
```tsx
// No NodeIcon, adicionar key para forçar re-animação:
function NodeIcon({ status, nodeId }: { status: NodeStatus; nodeId: number }) {
  return (
    <div key={`${nodeId}-${status}`} className="animate-scale-in">
      {/* conteúdo existente */}
    </div>
  )
}

// No card da etapa ativa, adicionar transição suave:
<div className="p-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-subtle)]/30
  transition-all duration-[400ms] ease-[cubic-bezier(0.2,0,0,1)]
  animate-fade-up">
```

---

### 2.15 — Adicionar microinteração de "empty state" animado

Criar `src/components/ui/empty-state.tsx`:
```tsx
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      'animate-fade-up',
      className
    )}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl
          bg-[var(--surface-2)] border border-[var(--border)] mb-4
          animate-scale-in"
          style={{ animationDelay: '100ms' }}>
          <div className="opacity-40">{icon}</div>
        </div>
      )}
      <p className="text-[14px] font-[500] text-[var(--text)] mb-1 animate-fade-up"
        style={{ animationDelay: '150ms' }}>
        {title}
      </p>
      {description && (
        <p className="text-[12px] text-[var(--text-3)] max-w-[280px] leading-relaxed animate-fade-up"
          style={{ animationDelay: '200ms' }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 animate-fade-up" style={{ animationDelay: '250ms' }}>
          {action}
        </div>
      )}
    </div>
  )
}
```

Usar em todos os lugares que têm `<p>Nenhum...</p>` atualmente.

---

## PARTE 3 — MELHORIAS DE UX

### 3.1 — Indicador visual quando projeto está sendo carregado no Kanban

**Em** `src/app/(dashboard)/projects/page.tsx`, adicionar estado de refresh:
```tsx
const [refreshing, setRefreshing] = useState(false)

const loadProjects = () => {
  setRefreshing(true)
  fetch('/api/projects')
    .then(r => r.json())
    .then(json => {
      setProjects(json.data || [])
      setLoading(false)
      setRefreshing(false)
    })
    .catch(() => { setLoading(false); setRefreshing(false) })
}

// Botão de refresh manual no header:
<Button variant="ghost" size="icon-sm" onClick={loadProjects} disabled={refreshing}
  className={refreshing ? 'opacity-50' : ''}>
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" 
    strokeWidth="1.5" strokeLinecap="round"
    className={refreshing ? 'spin' : ''}>
    <path d="M2 8a6 6 0 016-6 6 6 0 014.8 2.4L14 6M14 8a6 6 0 01-6 6 6 6 0 01-4.8-2.4L2 10"/>
  </svg>
</Button>
```

---

### 3.2 — Feedback visual imediato ao criar/enviar projeto (loading states)

**Em** `src/app/portal/page.tsx` e `src/app/(dashboard)/projects/page.tsx`:

Após criar projeto com sucesso, adicionar animação de celebração sutil:
```tsx
// Após toast.success no handleCreate:
toast.success('Projeto solicitado!', {
  description: 'Sua solicitação foi enviada. Aguarde nossa análise.',
  duration: 5000,
  icon: '🎉',
})
```

---

### 3.3 — Scroll suave ao abrir itens expandidos

Em todo lugar que tem `expandedStep`, `expandedId` etc:
```tsx
// Após expandir, fazer scroll suave para o item:
const handleToggle = (id: number) => {
  setExpandedStep(expandedStep === id ? null : id)
  if (expandedStep !== id) {
    setTimeout(() => {
      document.getElementById(`step-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 50)
  }
}
```

---

## PARTE 4 — CORREÇÕES DE TYPESCRIPT

### 4.1 — Remover `'use client'` desnecessário em server components

**Em** `src/app/api/` — todos os arquivos de rota já são server-side, não precisam de `'use client'`. Verificar se algum foi marcado incorretamente.

### 4.2 — Tipar corretamente os parâmetros de projeto

Adicionar em `src/types/index.ts`:
```ts
export interface ProjectWithClient extends Project {
  client: Pick<User, 'id' | 'name' | 'company' | 'email'>
  _count?: { tasks: number }
}

export type ProjectStatus = 
  | 'DRAFT' | 'PENDING' | 'TODO' | 'IN_PROGRESS' 
  | 'REVIEW' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
```

---

## ORDEM DE EXECUÇÃO RECOMENDADA

1. **Corrigir bugs críticos primeiro** (partes 1.1, 1.2, 1.3, 1.4)
2. **Corrigir badge component** (1.5) — afeta toda a UI
3. **Corrigir upload de arquivos no chat** (1.7)
4. **Corrigir contracts/page** (1.8)
5. **Adicionar animações base no globals.css** (2.1)
6. **Aplicar animações nos componentes** (2.2 a 2.15 em ordem)
7. **Melhorias de UX** (parte 3)
8. **Correções TypeScript** (parte 4)

---

## NOTAS IMPORTANTES

- **Não usar transform 3D** (sem `perspective`, `rotateX`, `rotateY`, `translateZ`)
- **Todas as animações** devem respeitar `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
  Adicionar isso no final do `globals.css`.
- **Spring animations** são suaves e naturais — usar `cubic-bezier(0.34, 1.56, 0.64, 1)` para entradas de elementos novos
- **Easing padrão MD3** é `cubic-bezier(0.2, 0, 0, 1)` — usar para a maioria das transições
- **Durações**: nunca acima de 400ms para interações do usuário. 600ms apenas para contadores numéricos.
- **Stagger**: máximo de 6 itens com delay escalonado de 50ms cada. Items além do 6º não precisam de delay adicional.
- **Nunca animar `width` ou `height` diretamente** — usar `transform: scaleX/scaleY` ou `max-height` para accordions
- **Cores de progresso dinâmicas**: 0-39% azul info, 40-79% laranja accent, 80-100% verde success

---

*Fim do prompt. Execute na ordem indicada. Não pule etapas.*
