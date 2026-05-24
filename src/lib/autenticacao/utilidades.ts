import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import {
  HIERARQUIA,
  cargoParaNivel,
  cargoEhOwner,
  cargoEhAdmin,
  cargoEhModeradorOuSuperior,
  cargoEhDeveloperOuSuperior,
  podeGerenciarCargo,
  type Cargo,
  type Permissao,
} from '@/lib/hierarquia'

// Re-export do tipo Role com alias para compatibilidade
export type Role = Cargo

// ─── Constantes derivadas da HIERARQUIA ───
export const ROLES = HIERARQUIA.map(h => ({
  role: h.cargo,
  level: h.nivel,
  label: h.rotulo,
}))

export const ROLE_LEVELS = Object.fromEntries(
  HIERARQUIA.map(h => [h.cargo, h.nivel])
) as Record<Cargo, number>

export const ROLE_LABELS = Object.fromEntries(
  HIERARQUIA.map(h => [h.cargo, h.rotulo])
) as Record<Cargo, string>

export const DEFAULT_PERMISSIONS = Object.fromEntries(
  HIERARQUIA.map(h => [h.cargo, [...h.permissoesPadrao]])
) as Record<Cargo, string[]>

export const ALL_PERMISSIONS = [
  { key: 'manage_users', label: 'Gerenciar Usuários' },
  { key: 'manage_projects', label: 'Gerenciar Projetos' },
  { key: 'manage_clients', label: 'Gerenciar Clientes' },
  { key: 'manage_financial', label: 'Financeiro' },
  { key: 'manage_contracts', label: 'Contratos' },
  { key: 'manage_crm', label: 'CRM' },
  { key: 'manage_chat', label: 'Chat / Mensagens' },
  { key: 'manage_analytics', label: 'Analytics' },
  { key: 'manage_automations', label: 'Automações' },
  { key: 'manage_tickets', label: 'Tickets' },
  { key: 'manage_knowledge', label: 'Conhecimento' },
  { key: 'manage_settings', label: 'Configurações' },
  { key: 'manage_integrations', label: 'Integrações (WhatsApp)' },
  { key: 'manage_ai', label: 'IA / Chat Avançado' },
  { key: 'manage_whatsapp', label: 'WhatsApp (envio manual)' },
  { key: 'create_projects', label: 'Criar Projetos' },
  { key: 'view_financial', label: 'Ver Financeiro' },
  { key: 'sign_contracts', label: 'Assinar Contratos' },
]

// ═══════════════════════════════════════════════════════
// FUNÇÕES (delegam para hierarquia.ts)
// ═══════════════════════════════════════════════════════

export function getRoleLevel(role: string | undefined): number {
  if (!role) return 0
  const normalized = role === 'CLIENT' ? 'USER' : role
  return cargoParaNivel(normalized)
}

export function getRoleLabel(role: string | undefined): string {
  if (!role) return 'Sem cargo'
  const normalized = role === 'CLIENT' ? 'USER' : role
  return ROLE_LABELS[normalized as Cargo] || role
}

export function hasPermission(role: string | undefined, permission: string, userPermissions?: string[]): boolean {
  const level = getRoleLevel(role)
  if (level >= 100) return true
  if (userPermissions !== undefined) return userPermissions.includes(permission)
  const defaults = DEFAULT_PERMISSIONS[role as Cargo] || []
  return defaults.includes(permission)
}

export function canAccess(user: any, permission: string): boolean {
  if (!user) return false
  const role = user.role || 'GUEST'
  const perms = user.permissions ? parsePermissions(user.permissions) : undefined
  return hasPermission(role, permission, perms)
}

export function canManageRole(actorRole: string | undefined, targetRole: string | undefined): boolean {
  return podeGerenciarCargo(actorRole, targetRole)
}

export function isOwner(user: any): boolean {
  return cargoEhOwner(user?.role)
}

export function isAdmin(user: any): boolean {
  return cargoEhAdmin(user?.role)
}

export function isModeratorOrAbove(user: any): boolean {
  return cargoEhModeradorOuSuperior(user?.role)
}

export function isDeveloperOrAbove(user: any): boolean {
  return cargoEhDeveloperOuSuperior(user?.role)
}

export async function getSessionUser(request?: NextRequest) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) return null

  const role = (token.role as string) || 'USER'

  return {
    id: token.id as string,
    email: token.email as string,
    name: token.name as string,
    role,
    roleLevel: getRoleLevel(role),
    permissions: parsePermissions(token.permissions as string),
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
}

export function parsePermissions(perm: string | null | undefined): string[] {
  try { return perm ? JSON.parse(perm) : [] } catch { return [] }
}

export function getEffectivePermissions(role: string | undefined, userPermissions?: string | null): string[] {
  const defaults = DEFAULT_PERMISSIONS[role as Cargo] || []
  const overrides = parsePermissions(userPermissions)
  if (getRoleLevel(role) >= 100) return ALL_PERMISSIONS.map(p => p.key)
  if (overrides.length > 0) return overrides
  return defaults
}
