// ═══════════════════════════════════════════════════════
// HIERARQUIA — Definições de cargos, níveis e permissões
// CLIENT-SAFE — Funções puras, sem acesso a banco de dados
// ═══════════════════════════════════════════════════════

// ─── Tipos ───
export type Cargo = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'DEVELOPER' | 'USER' | 'GUEST'
export type Permissao =
  | 'manage_users' | 'manage_projects' | 'manage_clients' | 'manage_financial'
  | 'manage_contracts' | 'manage_crm' | 'manage_chat' | 'manage_analytics'
  | 'manage_automations' | 'manage_tickets' | 'manage_knowledge' | 'manage_settings'
  | 'manage_integrations' | 'manage_ai' | 'manage_whatsapp'
  | 'create_projects' | 'view_financial' | 'sign_contracts'

// ─── Estrutura de cargo ───
export interface DefinicaoCargo {
  cargo: Cargo
  nivel: number
  rotulo: string
  icone: string
  permissoesPadrao: Permissao[]
  rotasPermitidas: string[]
  podeGerenciarCargos: Cargo[]
  descricao: string
  herdado: boolean
}

// ─── Dados de verificação (usado em server, mas tipagem é client-safe) ───
export interface ResultadoVerificacao {
  autorizado: boolean
  nivel: number
  cargo: string
  cargoNormalizado: Cargo
  rotulo: string
  permissoes: string[]
  podeGerenciar: string[]
  rotas: string[]
  erro?: string
}

export interface PermissaoFrontend {
  nivel: number
  cargo: string
  rotulo: string
  autorizado: boolean
}

// ─── HIERARQUIA COMPLETA ───
export const HIERARQUIA: DefinicaoCargo[] = [
  {
    cargo: 'OWNER',
    nivel: 100,
    rotulo: 'Owner / Criador',
    icone: 'Crown',
    permissoesPadrao: [
      'manage_users', 'manage_projects', 'manage_clients', 'manage_financial',
      'manage_contracts', 'manage_crm', 'manage_chat', 'manage_analytics',
      'manage_automations', 'manage_tickets', 'manage_knowledge', 'manage_settings',
      'manage_integrations', 'manage_ai', 'manage_whatsapp',
      'create_projects', 'view_financial', 'sign_contracts',
    ],
    rotasPermitidas: ['*'],
    podeGerenciarCargos: ['OWNER', 'ADMIN', 'MODERATOR', 'DEVELOPER', 'USER', 'GUEST'],
    descricao: 'Acesso total ao sistema. Pode gerenciar todos os aspectos, incluindo outros Owners.',
    herdado: false,
  },
  {
    cargo: 'ADMIN',
    nivel: 80,
    rotulo: 'Administrador',
    icone: 'Shield',
    permissoesPadrao: [
      'manage_users', 'manage_projects', 'manage_clients', 'manage_financial',
      'manage_contracts', 'manage_crm', 'manage_chat', 'manage_analytics',
      'manage_automations', 'manage_tickets', 'manage_knowledge', 'manage_settings',
      'manage_integrations', 'manage_ai',
      'create_projects', 'view_financial', 'sign_contracts',
    ],
    rotasPermitidas: [
      '/dashboard', '/projects', '/clients', '/crm', '/analytics',
      '/automations', '/files', '/tickets', '/calendar',
      '/settings', '/ai', '/contracts', '/feedbacks-ia', '/audit-logs',
      '/financial', '/knowledge', '/profile', '/notifications',
    ],
    podeGerenciarCargos: ['ADMIN', 'MODERATOR', 'DEVELOPER', 'USER', 'GUEST'],
    descricao: 'Gerencia a operação. Pode gerenciar usuários, projetos, financeiro, contratos e integrações.',
    herdado: false,
  },
  {
    cargo: 'MODERATOR',
    nivel: 60,
    rotulo: 'Moderador',
    icone: 'Gavel',
    permissoesPadrao: [
      'manage_projects', 'manage_clients', 'manage_chat',
      'manage_tickets', 'manage_knowledge',
      'create_projects', 'view_financial', 'sign_contracts',
    ],
    rotasPermitidas: [
      '/dashboard', '/projects', '/clients', '/tickets',
      '/knowledge', '/profile', '/notifications',
      '/financial', '/chat',
    ],
    podeGerenciarCargos: ['DEVELOPER', 'USER', 'GUEST'],
    descricao: 'Modera conteúdo e gerencia projetos, clientes e tickets.',
    herdado: false,
  },
  {
    cargo: 'DEVELOPER',
    nivel: 40,
    rotulo: 'Desenvolvedor',
    icone: 'Code',
    permissoesPadrao: [
      'manage_projects', 'manage_chat', 'manage_tickets',
      'create_projects', 'view_financial',
    ],
    rotasPermitidas: [
      '/dashboard', '/projects', '/tickets', '/chat',
      '/profile', '/notifications', '/financial',
    ],
    podeGerenciarCargos: ['USER', 'GUEST'],
    descricao: 'Desenvolve e gerencia projetos e tickets. Acesso ao chat e financeiro (consulta).',
    herdado: false,
  },
  {
    cargo: 'USER',
    nivel: 20,
    rotulo: 'Usuário',
    icone: 'User',
    permissoesPadrao: [
      'create_projects', 'view_financial', 'sign_contracts',
    ],
    rotasPermitidas: [
      '/dashboard', '/projects', '/portal', '/profile',
      '/notifications', '/financial', '/chat',
    ],
    podeGerenciarCargos: [],
    descricao: 'Usuário padrão (cliente). Cria projetos, visualiza financeiro e assina contratos.',
    herdado: false,
  },
  {
    cargo: 'GUEST',
    nivel: 0,
    rotulo: 'Visitante',
    icone: 'Eye',
    permissoesPadrao: [],
    rotasPermitidas: ['/dashboard'],
    podeGerenciarCargos: [],
    descricao: 'Acesso mínimo. Apenas visualização básica.',
    herdado: false,
  },
]

// ─── Mapas rápidos para O(1) ───
const MAPA_POR_CARGO = new Map<Cargo, DefinicaoCargo>()
const MAPA_POR_NIVEL = new Map<number, DefinicaoCargo>()
for (const def of HIERARQUIA) {
  MAPA_POR_CARGO.set(def.cargo, def)
  MAPA_POR_NIVEL.set(def.nivel, def)
}

// ═══════════════════════════════════════════════════════
// FUNÇÕES PURAS (sem DB, seguras para client)
// ═══════════════════════════════════════════════════════

/**
 * Normaliza uma string de cargo para o tipo Cargo.
 * Converte 'CLIENT' para 'USER' (legado).
 */
export function normalizarCargo(role: string | null | undefined): Cargo {
  if (!role) return 'GUEST'
  if (role === 'CLIENT') return 'USER'
  const upper = role.toUpperCase() as Cargo
  if (MAPA_POR_CARGO.has(upper)) return upper
  return 'GUEST'
}

/**
 * Converte uma string de cargo para nível numérico.
 * Usado em sessões JWT onde o role já está no token.
 */
export function cargoParaNivel(role: string | null | undefined): number {
  const c = normalizarCargo(role)
  return MAPA_POR_CARGO.get(c)?.nivel ?? 0
}

export function cargoEhOwner(role: string | null | undefined): boolean {
  return cargoParaNivel(role) >= 100
}

export function cargoEhAdmin(role: string | null | undefined): boolean {
  return cargoParaNivel(role) >= 80
}

export function cargoEhModeradorOuSuperior(role: string | null | undefined): boolean {
  return cargoParaNivel(role) >= 60
}

export function cargoEhDeveloperOuSuperior(role: string | null | undefined): boolean {
  return cargoParaNivel(role) >= 40
}

/**
 * Verifica se o ator pode gerenciar o cargo alvo (síncrono, sem DB).
 */
export function podeGerenciarCargo(atorRole: string | null | undefined, alvoRole: string | null | undefined): boolean {
  const atorNivel = cargoParaNivel(atorRole)
  const alvoNivel = cargoParaNivel(alvoRole)
  if (alvoNivel >= 100) return atorNivel >= 100
  return atorNivel > alvoNivel
}

/**
 * Retorna apenas rótulos de cargo para exibição no frontend.
 * NÃO expõe níveis, permissões ou estrutura interna.
 */
export function rotulosCargoParaFrontend(): { cargo: string; rotulo: string; icone: string }[] {
  return HIERARQUIA.map(h => ({ cargo: h.cargo, rotulo: h.rotulo, icone: h.icone }))
}

/**
 * Converte resultado de verificação para o formato seguro do frontend.
 */
export function paraFrontend(r: ResultadoVerificacao): PermissaoFrontend {
  return {
    nivel: r.nivel,
    cargo: r.autorizado ? r.cargo : 'GUEST',
    rotulo: r.rotulo,
    autorizado: r.autorizado,
  }
}
