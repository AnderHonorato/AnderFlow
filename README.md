# ANDERFLOW Sistemas

**Plataforma SaaS Premium de Gestão de Projetos e Relacionamento com Clientes**

Desenvolvido por Anderson — sistema completo para centralizar atendimento, projetos, pagamentos, contratos, arquivos, suporte e comunicação com clientes.

---

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14 (App Router) + React 18 + TypeScript |
| **Estilo** | Tailwind CSS + Radix UI + Framer Motion |
| **Backend** | Next.js API Routes + Prisma ORM |
| **Banco** | SQLite (dev) / PostgreSQL (produção) |
| **Auth** | NextAuth.js (JWT + Google OAuth) |
| **Realtime** | Socket.IO (WebSocket) |
| **Estado** | Zustand + React Query |
| **Ícones** | Lucide React |
| **Notificações** | Sonner (toast) |

---

## 📂 Estrutura

```
src/
├── app/
│   ├── (auth)/          # Login, registro, recuperação de senha
│   ├── (dashboard)/     # Painel admin com 23 páginas
│   │   ├── ai/           analytics/    audit-logs/
│   │   ├── automations/  calendar/    changelog/
│   │   ├── chat/         clients/     contracts/
│   │   ├── crm/          dashboard/   feedback/
│   │   ├── files/        financial/   help/
│   │   ├── notifications/ onboarding/  plans/
│   │   ├── profile/      projects/    settings/
│   │   └── tickets/
│   ├── (portal)/        # Portal do cliente
│   └── api/             # 14 rotas REST
├── components/
│   ├── ui/              # 14 componentes (Button, Card, Dialog, Skeleton...)
│   ├── layout/          # Sidebar, Header
│   └── comments/        # Thread de comentários
├── lib/                 # Prisma, Auth, Socket.IO, API client, Utils
├── hooks/               # useDebounce, useMediaQuery
├── stores/              # Zustand (app, projetos)
├── providers/           # Theme, Query, Session
└── types/               # TypeScript types
```

---

## ⚡ Início Rápido

```bash
# Instalar dependências
npm install

# Criar banco SQLite e seed com dados demo
npx prisma db push
npx tsx prisma/seed.ts

# Rodar servidor de desenvolvimento
npm run dev
#roda com edição em tempo real
npm run watch
# → http://localhost:3000
```

### 🔐 Logins Demo

| Perfil | Email | Senha |
|--------|-------|-------|
| **Desenvolvedor** | admin@andero.com.br | admin123 |
| Cliente 1 | carlos@techstore.com | client123 |
| Cliente 2 | ana@fastfood.com | client123 |

---

## 📊 Páginas e Funcionalidades

### Painel Admin (23 páginas)

| Página | Funcionalidade |
|--------|---------------|
| **Dashboard** | KPIs em tempo real, projetos recentes, saldo financeiro |
| **Projetos** | Kanban + Lista, busca, criação com briefing |
| **Clientes** | CRUD completo, health score, busca |
| **CRM** | Pipeline de vendas, cadastro de leads |
| **Chat** | Mensagens reais via API, múltiplos canais |
| **Financeiro** | Faturas, pagamentos, métricas |
| **Tickets** | Suporte, prioridades, categorias |
| **Contratos** | Gestão de contratos digitais |
| **Arquivos** | Upload drag-and-drop, preview |
| **Analytics** | Receita, performance, métricas |
| **Automações** | Workflows automáticos |
| **IA** | Insights, assistente, capacidades |
| **Calendário** | Eventos e prazos |
| **Onboarding** | Checklist de configuração |
| **Notificações** | Tempo real, marcar lidas |
| **Ajuda** | Central de conhecimento, FAQ |
| **Planos** | Basic/Pro/Enterprise |
| **Changelog** | Histórico de versões |
| **Feedback** | Sugestões e roadmap |
| **Perfil** | Dados pessoais, segurança, 2FA |
| **Auditoria** | Logs completos de atividades |
| **Configurações** | Módulos, aparência, tema |

### Portal do Cliente (8 páginas)
Dashboard, Projetos, Mensagens, Financeiro, Contratos, Tickets, Arquivos, Calendário

### APIs (14 rotas)
`/api/dashboard`, `projects`, `tasks`, `clients`, `leads`, `invoices`, `tickets`, `notifications`, `messages`, `channels`, `payments`, `auth/register`, `auth/forgot-password`, `webhooks/stripe`

---

## 🛠️ Comandos

```bash
npm run dev          # Servidor de desenvolvimento (porta 3000)
npm run build        # Build de produção
npm run typecheck    # Verificação TypeScript
npm run lint         # ESLint
npx prisma studio    # Interface visual do banco (porta 5555)
```

---

## 📝 Notas do Desenvolvedor

### Banco de Dados
- **Desenvolvimento**: SQLite (`prisma/dev.db`) — zero configuração
- **Produção**: Alterar `datasource db` em `prisma/schema.prisma` para PostgreSQL

### Autenticação
- NextAuth com JWT + credenciais + Google OAuth
- Middleware protege todas as rotas privadas
- 2FA modelado (implementação requer Google Authenticator)

### Socket.IO
- Servidor em `server/socket.ts` (porta 3001)
- Cliente em `src/lib/socket.ts`
- Chat usa API REST com fallback para Socket.IO

### Performance
- React Query com cache de 60s
- Componentes lazy-loading via Next.js App Router
- Skeleton loading em todas as páginas com dados assíncronos

### Design System
- Inspirado em Stripe, Linear, Notion, Vercel
- Dark/Light mode com transição suave
- Cores HSL via CSS custom properties
- Tipografia Inter (Google Fonts)

---

## 🔒 Segurança

- Senhas: bcrypt (12 rounds)
- JWT com rotação de token
- Rate limiting (middleware)
- CORS configurado
- Headers de segurança CSP/XSS
- Auditoria de todas as ações
- LGPD: consentimento, exclusão de dados

---

**ANDERFLOW Sistemas** © 2026 — Todos os direitos reservados.
