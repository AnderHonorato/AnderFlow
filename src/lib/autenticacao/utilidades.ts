import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export type Role = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'DEVELOPER' | 'USER' | 'GUEST'

export const ROLES: { role: Role; level: number; label: string }[] = [
  { role: 'OWNER', level: 100, label: 'Owner / Criador' },
  { role: 'ADMIN', level: 80, label: 'Administrador' },
  { role: 'MODERATOR', level: 60, label: 'Moderador' },
  { role: 'DEVELOPER', level: 40, label: 'Desenvolvedor' },
  { role: 'USER', level: 20, label: 'Usuário' },
  { role: 'GUEST', level: 0, label: 'Visitante' },
]

export const ROLE_LEVELS: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 80,
  MODERATOR: 60,
  DEVELOPER: 40,
  USER: 20,
  GUEST: 0,
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner / Criador',
  ADMIN: 'Administrador',
  MODERATOR: 'Moderador',
  DEVELOPER: 'Desenvolvedor',
  USER: 'Usuário',
  GUEST: 'Visitante',
}

export const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  OWNER: [
    'manage_users', 'manage_projects', 'manage_clients', 'manage_financial',
    'manage_contracts', 'manage_crm', 'manage_chat', 'manage_analytics',
    'manage_automations', 'manage_tickets', 'manage_knowledge', 'manage_settings',
    'manage_integrations', 'manage_ai', 'manage_whatsapp',
    'create_projects', 'view_financial', 'sign_contracts',
  ],
  ADMIN: [
    'manage_users', 'manage_projects', 'manage_clients', 'manage_financial',
    'manage_contracts', 'manage_crm', 'manage_chat', 'manage_analytics',
    'manage_automations', 'manage_tickets', 'manage_knowledge', 'manage_settings',
    'manage_integrations', 'manage_ai',
    'create_projects', 'view_financial', 'sign_contracts',
  ],
  MODERATOR: [
    'manage_projects', 'manage_clients', 'manage_chat',
    'manage_tickets', 'manage_knowledge',
    'create_projects', 'view_financial', 'sign_contracts',
  ],
  DEVELOPER: [
    'manage_projects', 'manage_chat', 'manage_tickets',
    'create_projects', 'view_financial',
  ],
  USER: [
    'create_projects', 'view_financial', 'sign_contracts',
  ],
  GUEST: [],
}

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

export function getRoleLevel(role: string | undefined): number {
  if (!role) return 0
  const normalized = role === 'CLIENT' ? 'USER' : role
  return ROLE_LEVELS[normalized as Role] || 0
}

export function getRoleLabel(role: string | undefined): string {
  if (!role) return 'Sem cargo'
  const normalized = role === 'CLIENT' ? 'USER' : role
  return ROLE_LABELS[normalized as Role] || role
}

export function hasPermission(role: string | undefined, permission: string, userPermissions?: string[]): boolean {
  const level = getRoleLevel(role)
  if (level >= 100) return true
  if (userPermissions !== undefined) return userPermissions.includes(permission)
  const defaults = DEFAULT_PERMISSIONS[role as Role] || []
  return defaults.includes(permission)
}

export function canAccess(user: any, permission: string): boolean {
  if (!user) return false
  const role = user.role || 'GUEST'
  const perms = user.permissions ? parsePermissions(user.permissions) : undefined
  return hasPermission(role, permission, perms)
}

export function canManageRole(actorRole: string | undefined, targetRole: string | undefined): boolean {
  const actorLevel = getRoleLevel(actorRole)
  const targetLevel = getRoleLevel(targetRole)
  if (targetLevel >= 100) return actorLevel >= 100
  return actorLevel > targetLevel
}

export function isOwner(user: any): boolean {
  return getRoleLevel(user?.role) >= 100
}

export function isAdmin(user: any): boolean {
  return getRoleLevel(user?.role) >= 80
}

export function isModeratorOrAbove(user: any): boolean {
  return getRoleLevel(user?.role) >= 60
}

export function isDeveloperOrAbove(user: any): boolean {
  return getRoleLevel(user?.role) >= 40
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
  const defaults = DEFAULT_PERMISSIONS[role as Role] || []
  const overrides = parsePermissions(userPermissions)
  if (getRoleLevel(role) >= 100) return ALL_PERMISSIONS.map(p => p.key)
  if (overrides.length > 0) return overrides
  return defaults
}
